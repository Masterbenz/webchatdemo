import { NextResponse } from "next/server";
import {
  getLineProfile,
  verifyLineSignature,
} from "@/lib/line";

import {
  addMessage,
  upsertUser,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request
) {
  try {
    // 1. อ่าน raw body จาก LINE โดยตรง
    const rawBody = await request.text();

    // 2. อ่าน signature
    const signature =
      request.headers.get(
        "x-line-signature"
      );

    console.log(
      "========== LINE WEBHOOK =========="
    );

    console.log(
      "Signature:",
      signature
    );

    console.log(
      "Raw body:",
      rawBody
    );

    console.log(
      "Channel Secret exists:",
      !!process.env.LINE_CHANNEL_SECRET
    );

    // 3. ตรวจสอบ signature
    if (!signature) {
      console.error(
        "❌ Missing x-line-signature"
      );

      return NextResponse.json(
        {
          error:
            "Missing LINE signature",
        },
        { status: 401 }
      );
    }

    const isValid =
      verifyLineSignature(
        rawBody,
        signature
      );

    console.log(
      "Signature valid:",
      isValid
    );

    if (!isValid) {
      console.error(
        "❌ Invalid LINE signature"
      );

      return NextResponse.json(
        {
          error:
            "Invalid signature",
        },
        { status: 401 }
      );
    }

    console.log(
      "✅ LINE signature verified"
    );

    // 4. Parse JSON หลัง verify เท่านั้น
    const payload =
      JSON.parse(rawBody);

    const events = Array.isArray(
      payload.events
    )
      ? payload.events
      : [];

    for (const event of events) {
      const lineUserId =
        event?.source?.userId;

      if (!lineUserId) {
        continue;
      }

      // Default profile
      let profile = {
        userId: lineUserId,
        displayName: "LINE User",
        pictureUrl:
          undefined as
            | string
            | undefined,
      };

      // ดึง Profile จาก LINE
      try {
        profile =
          await getLineProfile(
            lineUserId
          );
      } catch (error) {
        console.error(
          `Could not get LINE profile for ${lineUserId}`,
          error
        );
      }

      // =====================================
      // Upsert User → Redis
      // =====================================

      await upsertUser({
        lineUserId,
        displayName:
          profile.displayName,
        pictureUrl:
          profile.pictureUrl,
      });

      // =====================================
      // รับเฉพาะข้อความ Text
      // =====================================

      if (
        event.type === "message" &&
        event.message?.type === "text"
      ) {
        await addMessage({
          id:
            event.message.id ??
            crypto.randomUUID(),

          lineUserId,

          direction: "INBOUND",

          text:
            event.message.text,

          createdAt:
            new Date().toISOString(),

          // เก็บ token ไว้สำหรับ Mark as Read
          markAsReadToken:
            event.message
              .markAsReadToken,
        });

        console.log(
          "📩 Message received:",
          event.message.text
        );

        console.log(
          "🔑 markAsReadToken:",
          event.message
            .markAsReadToken
        );
      }
    }

    // LINE ต้องการ HTTP 200
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service:
        "LINE OA Webhook",
    },
    { status: 200 }
  );
}