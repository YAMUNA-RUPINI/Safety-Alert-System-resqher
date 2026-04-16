import { useState, useCallback, useRef } from "react";
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";
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

export function useEmergency(
  userId: string | undefined,
  userName: string | null | undefined
): UseEmergencyReturn {
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastEmergency, setLastEmergency] = useState<EmergencyResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const sendAlert = useSendAlert();
  const localVideoUrlsRef = useRef<string[]>([]);

  const getLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          resolve(`https://maps.google.com/?q=${latitude},${longitude}`);
        },
        (err) => reject(err),
        { timeout: 10000 }
      );
    });
  };

  const recordCamera = (facingMode: "user" | "environment", durationMs: number): Promise<string | null> => {
    return new Promise((resolve) => {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode }, audio: true })
        .then((stream) => {
          const chunks: BlobPart[] = [];
          const recorder = new MediaRecorder(stream);

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const label = facingMode === "user" ? "front" : "back";
            const a = document.createElement("a");
            a.href = url;
            a.download = `resqher-${label}-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            resolve(url);
          };

          recorder.onerror = () => {
            stream.getTracks().forEach((t) => t.stop());
            resolve(null);
          };

          recorder.start();
          setTimeout(() => {
            if (recorder.state !== "inactive") recorder.stop();
          }, durationMs);
        })
        .catch(() => resolve(null));
    });
  };

  const startCameraRecordings = async (): Promise<string[]> => {
    const urls: string[] = [];

    const frontUrl = await recordCamera("user", 30000);
    if (frontUrl) urls.push(frontUrl);

    const backUrl = await recordCamera("environment", 30000);
    if (backUrl) urls.push(backUrl);

    return urls;
  };

  const triggerEmergency = useCallback(async () => {
    if (!userId || isTriggering) return;

    setIsTriggering(true);
    setStatusMessage("getting-location");

    let locationLink = "https://maps.google.com/";
    try {
      locationLink = await getLocation();
    } catch {
      // Use fallback
    }

    setStatusMessage("starting-camera");
    void startCameraRecordings().then((urls) => {
      localVideoUrlsRef.current = urls;
    });

    const timestamp = new Date().toISOString();
    setStatusMessage("sending-alert");

    try {
      const emergencyData = {
        userId,
        timestamp,
        locationLink,
        status: "triggered",
        localVideoPath: null,
        createdAt: timestamp,
      };

      const emergencyRef = ref(database, `emergencies/${userId}`);
      await push(emergencyRef, emergencyData);

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
    } finally {
      setIsTriggering(false);
    }
  }, [userId, userName, isTriggering, sendAlert]);

  return { triggerEmergency, isTriggering, lastEmergency, statusMessage };
}
