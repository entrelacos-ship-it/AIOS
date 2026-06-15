import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { ensureDirs, UPLOAD_DIR } from '@/lib/storage';
import type { EloCutProject } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    ensureDirs();
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const prompt = formData.get('prompt')?.toString().trim() || undefined;
    if (!file) return NextResponse.json({ error: 'No video file' }, { status: 400 });

    const id = uuid();
    const ext = path.extname(file.name) || '.mp4';
    const filename = `${id}${ext}`;
    const uploadPath = path.join(UPLOAD_DIR, filename);
    await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

    const project: EloCutProject = {
      id,
      originalFilename: file.name,
      uploadPath,
      userPrompt: prompt,
      subtitles: [],
      fps: 30,
      width: 1080,
      height: 1920,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
