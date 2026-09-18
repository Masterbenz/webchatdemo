import { NextResponse } from "next/server";

import { getUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getUsers();

    users.sort((a, b) =>
      a.displayName.localeCompare(
        b.displayName
      )
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return NextResponse.json(
      {
        error: "โหลด User ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}