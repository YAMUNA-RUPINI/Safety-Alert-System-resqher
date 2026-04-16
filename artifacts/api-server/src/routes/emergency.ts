import { Router, type IRouter } from "express";
import { db } from "../lib/firebase-admin";
import { sendEmergencySMS } from "../lib/twilio";
import { SendAlertBody, GetEmergenciesParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/send-alert", async (req, res): Promise<void> => {
  const parsed = SendAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, locationLink, timestamp, recipientPhone, userName } = parsed.data;

  const emergencyData = {
    userId,
    timestamp,
    locationLink,
    status: "emergency_triggered",
    frontVideoLocalPath: null,
    backVideoLocalPath: null,
    createdAt: new Date().toISOString(),
  };

  let firebaseKey: string | null = null;
  try {
    const emergencyRef = db.ref(`emergencies/${userId}`);
    const newRef = await emergencyRef.push(emergencyData);
    firebaseKey = newRef.key;
    req.log.info({ userId, firebaseKey }, "Emergency stored in Firebase");
  } catch (err) {
    req.log.error({ err }, "Failed to store emergency in Firebase");
  }

  let smsSid: string | null = null;
  let smsStatus: string = "not_configured";

  try {
    const smsResult = await sendEmergencySMS(recipientPhone, locationLink, timestamp, userName);
    if (smsResult) {
      smsSid = smsResult.sid;
      smsStatus = smsResult.status;
      req.log.info(
        { messageSid: smsResult.sid, status: smsResult.status, timestamp: smsResult.timestamp, recipientPhone },
        "Emergency SMS sent"
      );
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send emergency SMS");
    smsStatus = "failed";
  }

  res.json({
    success: true,
    sid: smsSid ?? undefined,
    status: "sent",
    firebaseKey: firebaseKey ?? undefined,
    smsStatus,
    message: "Emergency alert sent successfully",
  });
});

router.get("/emergencies/:userId", async (req, res): Promise<void> => {
  const paramsRaw = Array.isArray(req.params.userId)
    ? req.params.userId[0]
    : req.params.userId;

  const params = GetEmergenciesParams.safeParse({ userId: paramsRaw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId } = params.data;

  try {
    const snapshot = await db.ref(`emergencies/${userId}`).once("value");
    const data = snapshot.val() as Record<string, {
      userId: string;
      timestamp: string;
      locationLink: string;
      status: string;
      frontVideoLocalPath?: string | null;
      backVideoLocalPath?: string | null;
      localVideoPath?: string | null;
    }> | null;

    const emergencies = data
      ? Object.entries(data).map(([key, value]) => ({
          id: key,
          userId: value.userId,
          timestamp: value.timestamp,
          locationLink: value.locationLink,
          status: value.status,
          frontVideoLocalPath: value.frontVideoLocalPath ?? null,
          backVideoLocalPath: value.backVideoLocalPath ?? null,
          localVideoPath: value.localVideoPath ?? null,
        }))
      : [];

    emergencies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ emergencies });
  } catch (err) {
    logger.error({ err }, "Failed to fetch emergencies from Firebase");
    res.status(500).json({ error: "Failed to fetch emergency history" });
  }
});

export default router;
