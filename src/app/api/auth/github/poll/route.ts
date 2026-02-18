import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = "Iv1.b507a08c87ecfe98";

export async function POST(request: NextRequest) {
  try {
    const { device_code } = await request.json();

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Poll error:", error);
    return NextResponse.json({ error: "Failed to poll" }, { status: 500 });
  }
}
