import { useState, useCallback } from "react";
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { useSendAlert } from "@workspace/api-client-react";

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

  const startCameraRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resqher-emergency-${Date.now()}.webm`;
        a.click();
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      }, 30000);
    } catch {
      // Camera not available — continue with alert anyway
    }
  };

  const triggerEmergency = useCallback(async () => {
    if (!userId || isTriggering) return;

    const recipientPhone = localStorage.getItem("emergencyContact");
    if (!recipientPhone) {
      setStatusMessage("no-contact");
      return;
    }

    setIsTriggering(true);
    setStatusMessage("getting-location");

    let locationLink = "https://maps.google.com/";
    try {
      locationLink = await getLocation();
    } catch {
      // Use fallback
    }

    setStatusMessage("starting-camera");
    void startCameraRecording();

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
          recipientPhone,
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
