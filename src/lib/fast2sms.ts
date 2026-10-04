/**
 * Fast2SMS Smart OTP client. The OTP template (channel, expiry, fallback) is
 * configured in the Fast2SMS dashboard under "Smart OTP"; we only reference
 * it by its OTP ID. Fast2SMS generates and verifies the code itself.
 */

const SEND_URL = "https://www.fast2sms.com/dev/otp/send";
const VERIFY_URL = "https://www.fast2sms.com/dev/otp/verify";

type Fast2SmsResponse = {
  return?: boolean;
  message?: string | string[];
};

export class Fast2SmsError extends Error {}

function apiKey() {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) throw new Fast2SmsError("FAST2SMS_API_KEY is not configured");
  return key;
}

function otpId() {
  const id = process.env.FAST2SMS_OTP_ID;
  if (!id) throw new Fast2SmsError("FAST2SMS_OTP_ID is not configured");
  return id;
}

/** Reduce any stored mobile number to the 10-digit form Fast2SMS expects. */
export function normalizeIndianMobile(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function maskMobile(mobile: string) {
  return `${"*".repeat(mobile.length - 4)}${mobile.slice(-4)}`;
}

async function post(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: apiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  let data: Fast2SmsResponse = {};
  try {
    data = (await res.json()) as Fast2SmsResponse;
  } catch {
    // Non-JSON body; treated as a failure below.
  }
  const message = Array.isArray(data.message)
    ? data.message.join(", ")
    : data.message;
  return { ok: res.ok && data.return === true, message };
}

export async function sendOtp(mobile: string) {
  const { ok, message } = await post(SEND_URL, { otp_id: otpId(), mobile });
  if (!ok) throw new Fast2SmsError(message || "Failed to send OTP");
}

/** Returns true only when Fast2SMS confirms the code for this number. */
export async function verifyOtp(mobile: string, otp: string) {
  const { ok } = await post(VERIFY_URL, { mobile, otp });
  return ok;
}
