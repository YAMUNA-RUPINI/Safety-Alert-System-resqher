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

export async function sendEmergencySMS(
  to: string,
  locationLink: string,
  timestamp: string,
  userName?: string | null
): Promise<string | null> {
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

  return message.sid;
}
