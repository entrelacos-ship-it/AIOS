import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'soft' | 'outlined';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'action';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'soft', 
  color = 'primary',
  className = '' 
}) => {
  // Updated to rounded-full
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider";
  
  const colors = {
    primary: { // Purple
      solid: "bg-primary text-white",
      soft: "bg-primary/10 text-primary border border-primary/20",
      outlined: "border border-primary text-primary bg-transparent"
    },
    accent: { // Turquoise
      solid: "bg-accent text-black",
      soft: "bg-accent/10 text-accent border border-accent/20",
      outlined: "border border-accent text-accent bg-transparent"
    },
    action: { // Orange
      solid: "bg-action text-white",
      soft: "bg-action/10 text-action border border-action/20",
      outlined: "border border-action text-action bg-transparent"
    },
    success: {
      solid: "bg-green-500 text-black",
      soft: "bg-green-500/10 text-green-500 border border-green-500/20",
      outlined: "border border-green-500 text-green-500 bg-transparent"
    },
    warning: {
      solid: "bg-yellow-500 text-black",
      soft: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
      outlined: "border border-yellow-500 text-yellow-500 bg-transparent"
    },
    danger: {
      solid: "bg-red-500 text-white",
      soft: "bg-red-500/10 text-red-500 border border-red-500/20",
      outlined: "border border-red-500 text-red-500 bg-transparent"
    },
    neutral: {
      solid: "bg-gray-200 text-black",
      soft: "bg-gray-800 text-gray-400 border border-gray-700",
      outlined: "border border-gray-600 text-gray-400 bg-transparent"
    }
  };

  return (
    <span className={`${baseStyles} ${colors[color][variant]} ${className}`}>
      {children}
    </span>
  );
};