import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

export interface EmergencyRecord {
  id: string;
  userId: string;
  timestamp: string;
  locationLink: string;
  status: string;
  localVideoPath?: string | null;
}

export function useEmergencyHistory(userId: string | undefined) {
  const [emergencies, setEmergencies] = useState<EmergencyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEmergencies([]);
      setLoading(false);
      return;
    }

    const emergencyRef = ref(database, `emergencies/${userId}`);
    const unsubscribe = onValue(emergencyRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<EmergencyRecord, "id">> | null;
      if (data) {
        const list = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        list.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setEmergencies(list);
      } else {
        setEmergencies([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { emergencies, loading };
}
