import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!client) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY for illustration generation' },
        { status: 500 }
      );
    }

    const { prompt, sceneId }: { prompt?: string; sceneId?: string } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing illustration prompt' }, { status: 400 });
    }

    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt: `${prompt}\n\nFormat: premium vertical editorial frame, cinematic lighting, highly legible subject separation, no text in image.`,
      size: '1024x1792',
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image returned by provider' }, { status: 500 });
    }

    return NextResponse.json({
      sceneId,
      dataUrl: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error('[illustrate]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
