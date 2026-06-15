import fs from 'fs';
import path from 'path';

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads');

export const OUTPUT_DIR = process.env.OUTPUT_DIR
  ? path.resolve(process.env.OUTPUT_DIR)
  : path.join(process.cwd(), 'outputs');

export const ILLUSTRATION_DIR = path.join(OUTPUT_DIR, 'illustrations');

const MIME_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

export function ensureDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ILLUSTRATION_DIR, { recursive: true });
}

export function getMimeType(filePath: string) {
  return MIME_MAP[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}
