import { NextResponse } from "next/server";

import {
  addMessage,
  getLatestMarkAsReadToken,
  getMessages,
  getUser,
} from "@/lib/store";

import {
  markLineChatAsRead,
  pushTextMessage,
} from "@/lib/line";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } =
    new URL(request.url);

  const lineUserId =
    searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json(
      {
        error: "lineUserId is required",
      },
      { status: 400 }
    );
  }

  const messages =
    await getMessages(lineUserId);

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const lineUserId =
      typeof body.lineUserId === "string"
        ? body.lineUserId
        : "";

    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    if (!lineUserId || !text) {
      return NextResponse.json(
        {
          error:
            "lineUserId และ text จำเป็นต้องมี",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบ User จาก Redis
    const user =
      await getUser(lineUserId);

    if (!user) {
      return NextResponse.json(
        {
          error: "ไม่พบ LINE User นี้",
        },
        { status: 404 }
      );
    }

    // ส่งไป LINE ก่อน
    await pushTextMessage(
      lineUserId,
      text
    );

    const message = {
      id: crypto.randomUUID(),
      lineUserId,
      direction: "OUTBOUND" as const,
      text,
      createdAt:
        new Date().toISOString(),
    };

    // บันทึกลง Redis
    await addMessage(message);

    return NextResponse.json(
      message,
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "ส่งข้อความไป LINE ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body = await request.json();

    const lineUserId =
      typeof body.lineUserId === "string"
        ? body.lineUserId
        : "";

    if (!lineUserId) {
      return NextResponse.json(
        {
          error:
            "lineUserId is required",
        },
        { status: 400 }
      );
    }

    const markAsReadToken =
      await getLatestMarkAsReadToken(
        lineUserId
      );

    if (!markAsReadToken) {
      return NextResponse.json({
        ok: true,
        marked: false,
        message: "ไม่มีข้อความใหม่",
      });
    }

    await markLineChatAsRead(
      markAsReadToken
    );

    return NextResponse.json({
      ok: true,
      marked: true,
    });
  } catch (error) {
    console.error(
      "Mark as read error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "ไม่สามารถ mark message as read ได้",
      },
      { status: 500 }
    );
  }
}