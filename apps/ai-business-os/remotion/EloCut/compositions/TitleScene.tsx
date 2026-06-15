import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import type { EloCutScene } from '../../../services/eloCutService';

interface TitleSceneProps {
  scene: EloCutScene;
  sceneProgress: number;
}

export const TitleScene: React.FC<TitleSceneProps> = ({ scene, sceneProgress }) => {
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, Math.round(sceneProgress * Math.max(fps * 1.4, 1)));

  const titleOpacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(localFrame, [0, 20], [60, 0], { extrapolateRight: 'clamp' });

  const keywordSpring = spring({
    frame: localFrame - 10,
    fps,
    config: { damping: 12, stiffness: 200 },
  });
  const keywordScale = interpolate(keywordSpring, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: '64px 56px',
        fontFamily: '"Sora", "Inter", "Segoe UI", sans-serif',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 620,
          maxWidth: '100%',
          background: `linear-gradient(135deg, ${scene.backgroundColor}cc, rgba(9,9,11,0.38))`,
          border: `1px solid ${scene.accentColor}44`,
          borderRadius: 28,
          padding: '26px 28px',
          backdropFilter: 'blur(18px)',
          boxShadow: `0 32px 80px ${scene.backgroundColor}55`,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            width: interpolate(localFrame, [5, 25], [0, 120], { extrapolateRight: 'clamp' }),
            height: 4,
            backgroundColor: scene.accentColor,
            borderRadius: 999,
            marginBottom: 18,
          }}
        />
        <h1
          style={{
            color: '#ffffff',
            fontSize: 54,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            textShadow: `0 10px 24px ${scene.backgroundColor}88`,
          }}
        >
          {scene.title}
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.78)',
            fontSize: 21,
            opacity: interpolate(localFrame, [20, 35], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(localFrame, [20, 35], [18, 0], { extrapolateRight: 'clamp' })}px)`,
            margin: '16px 0 0',
            lineHeight: 1.45,
          }}
        >
          {scene.description}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 22,
            flexWrap: 'wrap',
            transform: `scale(${keywordScale})`,
            opacity: keywordSpring,
          }}
        >
          {scene.keywords.map((kw, i) => (
            <span
              key={i}
              style={{
                backgroundColor: `${scene.accentColor}1f`,
                border: `1px solid ${scene.accentColor}55`,
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
