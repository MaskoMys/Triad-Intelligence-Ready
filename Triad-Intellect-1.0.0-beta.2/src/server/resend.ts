import type { SubmissionEnv } from "./submission";

export interface ResendMessage {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  readonly replyTo?: string | undefined;
}

export interface ResendResult {
  readonly delivered: boolean;
  readonly status: number;
}

export async function sendResendEmail(
  env: SubmissionEnv,
  message: ResendMessage,
  requestId: string,
): Promise<ResendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      "Idempotency-Key": requestId,
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.RECEIVER_EMAIL],
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  return { delivered: response.ok, status: response.status };
}
