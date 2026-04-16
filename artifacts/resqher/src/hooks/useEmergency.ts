import { useState, useCallback } from "react";
import { ref, push, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { saveVideoToIndexedDB } from "@/lib/indexeddb";
import { useSendAlert } from "@workspace/api-client-react";

const EMERGENCY_PHONE = "+916384215014";

interface EmergencyResult {
  locationLink: string;
  timestamp: string;
}

interface UseEmergencyReturn {
  triggerEmergency: () => Promise<void>;
  isTriggering: boolean;
  lastEmergency: EmergencyResult | null;
  statusMessage: string;
}

function getLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("https://maps.google.com/");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve(`https://maps.google.com/?q=${latitude},${longitude}`);
      },
      () => resolve("https://maps.google.com/"),
      { timeout: 10000 }
    );
  });
}

function recordCamera(
  facingMode: "user" | "environment",
  durationMs: number
): Promise<{ blob: Blob; filename: string } | null> {
  return new Promise((resolve) => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: true })
      .then((stream) => {
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        const label = facingMode === "user" ? "front" : "back";
        const filename = `${label}_${Date.now()}.webm`;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve({ blob, filename });
        };

        recorder.onerror = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(null);
        };

        recorder.start(1000);
        setTimeout(() => {
          if (recorder.state !== "inactive") recorder.stop();
        }, durationMs);
      })
      .catch(() => resolve(null));
  });
}

export function useEmergency(
  userId: string | undefined,
  userName: string | null | undefined
): UseEmergencyReturn {
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastEmergency, setLastEmergency] = useState<EmergencyResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const sendAlert = useSendAlert();

  const triggerEmergency = useCallback(async () => {
    if (!userId || isTriggering) return;

    setIsTriggering(true);

    // Step 1: Get location
    setStatusMessage("getting-location");
    const locationLink = await getLocation();

    const timestamp = new Date().toISOString();

    // Step 2: Write initial record to Firebase
    setStatusMessage("sending-alert");
    const emergencyRef = ref(database, `emergencies/${userId}`);
    let firebaseKey: string | null = null;
    try {
      const newRef = await push(emergencyRef, {
        userId,
        timestamp,
        locationLink,
        status: "emergency_triggered",
        frontVideoLocalPath: null,
        backVideoLocalPath: null,
        createdAt: timestamp,
      });
      firebaseKey = newRef.key;
    } catch {
      // Continue even if Firebase write fails
    }

    // Step 3: Send SMS
    try {
      await sendAlert.mutateAsync({
        data: {
          userId,
          locationLink,
          timestamp,
          recipientPhone: EMERGENCY_PHONE,
          userName: userName ?? null,
        },
      });
      setLastEmergency({ locationLink, timestamp });
      setStatusMessage("sent");
    } catch {
      setStatusMessage("failed");
    }

    setIsTriggering(false);

    // Step 4: Record front camera (30s) in background
    setStatusMessage("starting-camera");
    const frontResult = await recordCamera("user", 30000);

    let frontPath: string | null = null;
    if (frontResult) {
      try {
        frontPath = await saveVideoToIndexedDB(frontResult.filename, frontResult.blob);
      } catch {
        // IndexedDB save failed
      }
    }

    // Step 5: Record back camera (30s) in background
    const backResult = await recordCamera("environment", 30000);

    let backPath: string | null = null;
    if (backResult) {
      try {
        backPath = await saveVideoToIndexedDB(backResult.filename, backResult.blob);
      } catch {
        // IndexedDB save failed
      }
    }

    // Step 6: Update Firebase with video references
    if (firebaseKey && (frontPath || backPath)) {
      try {
        const recordRef = ref(database, `emergencies/${userId}/${firebaseKey}`);
        await update(recordRef, {
          frontVideoLocalPath: frontPath,
          backVideoLocalPath: backPath,
          status: "emergency_triggered",
        });
      } catch {
        // Firebase update failed
      }
    }

    setStatusMessage("");
  }, [userId, userName, isTriggering, sendAlert]);

  return { triggerEmergency, isTriggering, lastEmergency, statusMessage };
}
