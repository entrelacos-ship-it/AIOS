import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { getMimeType, OUTPUT_DIR, UPLOAD_DIR } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toWebStream(filePath: string, start?: number, end?: number): ReadableStream<Uint8Array> {
  return Readable.toWeb(
    fs.createReadStream(filePath, start !== undefined ? { start, end } : undefined),
  ) as ReadableStream<Uint8Array>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  // Try outputs first, then uploads
  let filePath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filePath)) filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return new NextResponse('Not found', { status: 404 });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get('range');
  const contentType = getMimeType(filePath);
  const isVideo = contentType.startsWith('video/');

  if (range && isVideo) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    return new NextResponse(
      toWebStream(filePath, start, end),
      {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
        },
      }
    );
  }

  return new NextResponse(
    toWebStream(filePath),
    {
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Accept-Ranges': isVideo ? 'bytes' : 'none',
      },
    }
  );
}
