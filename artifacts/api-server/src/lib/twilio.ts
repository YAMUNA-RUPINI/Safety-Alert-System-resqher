import twilio from "twilio";
import { logger } from "./logger";

const accountSid = process.env["TWILIO_ACCOUNT_SID"];
const authToken = process.env["TWILIO_AUTH_TOKEN"];
const twilioPhone = process.env["TWILIO_PHONE_NUMBER"];

if (!accountSid || !authToken || !twilioPhone) {
  logger.warn("Twilio credentials not fully configured. SMS alerts will be disabled.");
}

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export interface SMSResult {
  sid: string;
  status: string;
  timestamp: string;
}

export async function sendEmergencySMS(
  to: string,
  locationLink: string,
  timestamp: string,
  userName?: string | null
): Promise<SMSResult | null> {
  if (!client || !twilioPhone) {
    logger.warn("Twilio not configured, skipping SMS");
    return null;
  }

  const body = `EMERGENCY ALERT\nUser${userName ? ` ${userName}` : ""} triggered safety system\nLocation: ${locationLink}\nTime: ${timestamp}`;

  const message = await client.messages.create({
    body,
    from: twilioPhone,
    to,
  });

  const result: SMSResult = {
    sid: message.sid,
    status: message.status,
    timestamp: new Date().toISOString(),
  };

  logger.info(
    { messageSid: result.sid, status: result.status, timestamp: result.timestamp, to },
    "Emergency SMS sent successfully"
  );

  return result;
}
