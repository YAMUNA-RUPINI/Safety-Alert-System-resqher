import { Router, type IRouter } from "express";
import { sendEmergencySMS } from "../lib/twilio";
import { SendAlertBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/send-alert", async (req, res): Promise<void> => {
  const parsed = SendAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, locationLink, timestamp, recipientPhone, userName } = parsed.data;

  let smsSid: string | null = null;
  let smsStatus = "not_configured";

  try {
    const smsResult = await sendEmergencySMS(recipientPhone, locationLink, timestamp, userName);
    if (smsResult) {
      smsSid = smsResult.sid;
      smsStatus = smsResult.status;
      req.log.info(
        { messageSid: smsResult.sid, status: smsResult.status, timestamp: smsResult.timestamp, to: recipientPhone, userId },
        "Emergency SMS sent successfully"
      );
    } else {
      req.log.warn({ userId, recipientPhone }, "Twilio not configured — SMS skipped");
    }
  } catch (err) {
    req.log.error({ err, userId, recipientPhone }, "Failed to send emergency SMS");
    smsStatus = "failed";
  }

  res.json({
    success: true,
    sid: smsSid ?? undefined,
    status: "sent",
    smsStatus,
    message: "Emergency alert sent successfully",
  });
});

export default router;
