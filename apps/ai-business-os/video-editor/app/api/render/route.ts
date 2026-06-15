import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { convertScenesFromLegendaIndex } from '@/lib/convertScenes';
import { OUTPUT_DIR, ensureDirs } from '@/lib/storage';
import type { EloCutProject } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    ensureDirs();
    const { project }: { project: EloCutProject } = await req.json();
    if (!project.analysis) return NextResponse.json({ error: 'No analysis' }, { status: 400 });

    const scenesWithFrames = convertScenesFromLegendaIndex(
      project.analysis.scenes,
      project.subtitles,
      project.fps
    );

    const totalFrames = Math.max(
      scenesWithFrames.reduce((s, c) => s + (c.durationInFrames ?? 0), 0),
      30
    );

    const entryPoint = path.resolve(process.cwd(), 'remotion/index.ts');
    const outputPath = path.join(OUTPUT_DIR, `${project.id}_final.mp4`);
    const updatedProject = { ...project, analysis: { ...project.analysis, scenes: scenesWithFrames } };

    const bundleLocation = await bundle({ entryPoint });
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'EloCut',
      inputProps: { project: updatedProject },
    });

    await renderMedia({
      composition: { ...composition, durationInFrames: totalFrames },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { project: updatedProject },
    });

    return NextResponse.json({
      project: { ...updatedProject, outputPath },
      downloadUrl: `/api/video/${path.basename(outputPath)}`,
    });
  } catch (error) {
    console.error('[render]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
