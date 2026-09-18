import crypto from "crypto";

const LINE_API = "https://api.line.me/v2/bot";

function token() {
  const value = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!value) {
    throw new Error(
      "LINE_CHANNEL_ACCESS_TOKEN is not configured"
    );
  }

  return value;
}

export function verifyLineSignature(
  body: string,
  signature: string | null
) {
  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(signature);

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
}

export async function getLineProfile(userId: string) {
  const res = await fetch(
    `${LINE_API}/profile/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${token()}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      `LINE profile failed: ${res.status}`
    );
  }

  return res.json() as Promise<{
    userId: string;
    displayName: string;
    pictureUrl: string;
  }>;
}

export async function pushTextMessage(
  to: string,
  text: string
) {
  const res = await fetch(
    `${LINE_API}/message/push`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        to,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      `LINE push failed: ${res.status} ${await res.text()}`
    );
  }
}

export async function markLineChatAsRead(
  markAsReadToken: string
) {
  const res = await fetch(
    `${LINE_API}/chat/markAsRead`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        markAsReadToken,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      `LINE markAsRead failed: ${res.status} ${await res.text()}`
    );
  }
}