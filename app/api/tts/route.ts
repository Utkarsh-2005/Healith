import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tts
 * Body: { text: string; companion?: "lua" | "leon" }
 * Returns: audio/mpeg binary blob via Deepgram TTS
 *
 * The Deepgram model is selected based on the companion:
 *   - "lua"  (feminine) → DEEPGRAM_MODEL_NAME_F  (env, fallback aura-asteria-en)
 *   - "leon" (masculine) → DEEPGRAM_MODEL_NAME_M (env, fallback aura-orion-en)
 *   - absent / null       → DEEPGRAM_MODEL_NAME   (env, fallback aura-asteria-en)
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  const baseModel = process.env.DEEPGRAM_MODEL_NAME || "aura-asteria-en";
  const femaleModel = process.env.DEEPGRAM_MODEL_NAME_F || baseModel;
  const maleModel = process.env.DEEPGRAM_MODEL_NAME_M || baseModel;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });
  }

  const { text, companion } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  // Select model based on companion
  let model = baseModel;
  if (companion === "lua") model = femaleModel;
  else if (companion === "leon") model = maleModel;

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
