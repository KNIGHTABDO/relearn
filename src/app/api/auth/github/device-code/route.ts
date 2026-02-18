import { NextResponse } from "next/server";

const CLIENT_ID = "Iv1.b507a08c87ecfe98";

export async function POST() {
  try {
    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        scope: "read:user",
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Device code error:", error);
    return NextResponse.json({ error: "Failed to request device code" }, { status: 500 });
  }
}
