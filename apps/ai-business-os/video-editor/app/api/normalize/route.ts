import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { ensureDirs, UPLOAD_DIR } from '@/lib/storage';
import type { EloCutProject } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    ensureDirs();
    if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

    const { project }: { project: EloCutProject } = await req.json();
    const normalizedPath = path.join(UPLOAD_DIR, `${project.id}_norm.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(project.uploadPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .fps(30)
        .outputOptions([
          '-r 30',
          '-vsync cfr',
          '-crf 20',
          '-preset medium',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
          '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30',
        ])
        .output(normalizedPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return NextResponse.json({ project: { ...project, normalizedPath } });
  } catch (error) {
    console.error('[normalize]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
