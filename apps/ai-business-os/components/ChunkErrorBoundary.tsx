import React from 'react';
import type { ReactNode } from 'react';

interface ChunkErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

// React 19 without @types/react breaks class component typing.
// Workaround: define as plain class and cast to FC-compatible type.
const _Boundary = class extends (React.Component as any) {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ChunkErrorBoundary caught', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
};

export const ChunkErrorBoundary = _Boundary as unknown as React.ComponentType<ChunkErrorBoundaryProps>;
