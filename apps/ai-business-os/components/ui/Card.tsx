import React, { useRef, useState } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, ...props }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      {...props}
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-lg border border-border bg-card overflow-hidden group ${className}`}
    >
      {/* Spotlight Gradient */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(143, 67, 246, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        {(title || action) && (
          <div className="flex justify-between items-start mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-100 font-sans tracking-tight">{title}</h3>}
            {action}
          </div>
        )}
        <div className="text-gray-400 font-serif text-sm leading-relaxed flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};
