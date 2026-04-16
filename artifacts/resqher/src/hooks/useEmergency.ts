import { useState, useCallback } from "react";
import { ref, push, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { saveVideoToIndexedDB } from "@/lib/indexeddb";
import { useSendAlert } from "@workspace/api-client-react";

const EMERGENCY_PHONE = "+916384215014";
const RECORD_DURATION_MS = 30000;
const SMS_TIMEOUT_MS = 12000;

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
    if (!navigator.geolocation) { resolve("https://maps.google.com/"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
      () => resolve("https://maps.google.com/"),
      { timeout: 8000 }
    );
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

function downloadBlob(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  } catch { /* ignore */ }
}

function recordCamera(
  facingMode: "user" | "environment",
  durationMs: number
): Promise<{ blob: Blob; filename: string } | null> {
  return new Promise((resolve) => {
    const label = facingMode === "user" ? "front" : "back";
    const filename = `${label}_${Date.now()}.webm`;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: true })
      .then((stream) => {
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";

        let recorder: MediaRecorder;
        try {
          recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        } catch {
          recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (chunks.length === 0) { resolve(null); return; }
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve({ blob, filename });
        };
        recorder.onerror = () => { stream.getTracks().forEach((t) => t.stop()); resolve(null); };

        recorder.start(1000);
        setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, durationMs);
      })
      .catch((err) => {
        console.error(`Camera (${label}) error:`, err.name, err.message);
        resolve(null);
      });
  });
}

async function saveAndDownloadVideo(result: { blob: Blob; filename: string }): Promise<string | null> {
  // Auto-download to device
  downloadBlob(result.blob, result.filename);

  // Save to IndexedDB for Evidence page
  try {
    const path = await saveVideoToIndexedDB(result.filename, result.blob);
    console.log("Video saved to IndexedDB:", path);
    return path;
  } catch (err) {
    console.error("IndexedDB save failed:", err);
    return null;
  }
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

    // ── Step 1: Location ──────────────────────────────────────
    setStatusMessage("getting-location");
    const locationLink = await getLocation();
    const timestamp = new Date().toISOString();
    console.log("Emergency triggered:", { locationLink, timestamp });

    // ── Step 2: Write initial Firebase record ─────────────────
    const emergencyRef = ref(database, `emergencies/${userId}`);
    let firebaseKey: string | null = null;
    try {
      const newRef = await withTimeout(
        push(emergencyRef, {
          userId,
          timestamp,
          locationLink,
          status: "emergency_triggered",
          frontVideoLocalPath: null,
          backVideoLocalPath: null,
          createdAt: timestamp,
        }),
        8000
      );
      firebaseKey = newRef.key;
      console.log("Firebase record created:", firebaseKey);
    } catch (err) {
      console.error("Firebase write failed:", err);
    }

    // ── Step 3: Send SMS (with timeout — don't block on failure) ─
    setStatusMessage("sending-alert");
    try {
      const result = await withTimeout(
        sendAlert.mutateAsync({
          data: {
            userId,
            locationLink,
            timestamp,
            recipientPhone: EMERGENCY_PHONE,
            userName: userName ?? null,
          },
        }),
        SMS_TIMEOUT_MS
      );
      console.log("SMS API response:", result);
      setLastEmergency({ locationLink, timestamp });
      setStatusMessage("sent");
    } catch (err) {
      console.error("SMS send error:", err);
      setStatusMessage("failed");
    }

    setIsTriggering(false);

    // ── Step 4: Record both cameras simultaneously (30s each) ─
    setStatusMessage("starting-camera");
    console.log("Starting camera recordings…");

    const [frontResult, backResult] = await Promise.allSettled([
      recordCamera("user", RECORD_DURATION_MS),
      recordCamera("environment", RECORD_DURATION_MS),
    ]);

    const frontData = frontResult.status === "fulfilled" ? frontResult.value : null;
    const backData = backResult.status === "fulfilled" ? backResult.value : null;

    console.log("Recording done — front:", !!frontData, "back:", !!backData);

    // ── Step 5: Save to IndexedDB + auto-download ─────────────
    let frontPath: string | null = null;
    let backPath: string | null = null;

    const saves = await Promise.allSettled([
      frontData ? saveAndDownloadVideo(frontData) : Promise.resolve(null),
      backData ? saveAndDownloadVideo(backData) : Promise.resolve(null),
    ]);

    frontPath = saves[0].status === "fulfilled" ? saves[0].value : null;
    backPath = saves[1].status === "fulfilled" ? saves[1].value : null;

    // ── Step 6: Update Firebase with video references ─────────
    if (firebaseKey) {
      try {
        await withTimeout(
          update(ref(database, `emergencies/${userId}/${firebaseKey}`), {
            frontVideoLocalPath: frontPath,
            backVideoLocalPath: backPath,
            status: "emergency_triggered",
          }),
          8000
        );
        console.log("Firebase updated with video paths:", { frontPath, backPath });
      } catch (err) {
        console.error("Firebase video update failed:", err);
      }
    }

    setStatusMessage("");
  }, [userId, userName, isTriggering, sendAlert]);

  return { triggerEmergency, isTriggering, lastEmergency, statusMessage };
}
