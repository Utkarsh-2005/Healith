import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tts
 * Body: { text: string }
 * Returns: audio/mpeg binary blob via Deepgram TTS
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  const model = process.env.DEEPGRAM_MODEL_NAME || "aura-asteria-en";

  if (!apiKey) {
    return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const dgResponse = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    },
  );

  if (!dgResponse.ok) {
    const errText = await dgResponse.text();
    console.error("[TTS] Deepgram error:", dgResponse.status, errText);
    return NextResponse.json(
      { error: `Deepgram error (${dgResponse.status})` },
      { status: dgResponse.status },
    );
  }

  const audioBuffer = await dgResponse.arrayBuffer();

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
