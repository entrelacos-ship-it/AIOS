import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'white';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  // Updated to rounded-full
  const baseStyles = "relative overflow-hidden font-semibold text-sm transition-all duration-300 rounded-full px-5 py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Purple Institutional (Primary Active)
    primary: "bg-primary text-white hover:bg-primaryHover shadow-[0_0_15px_rgba(143,67,246,0.3)] hover:shadow-[0_0_25px_rgba(143,67,246,0.5)]",
    
    // Unselected Tag style (Dark Grey bg, Light Grey text)
    secondary: "bg-[#111110] border border-border text-[#E0E0E0] hover:bg-white hover:text-[#0A0A09] hover:border-white",
    
    // Selected Tag style (White bg, Black text)
    white: "bg-white text-[#0A0A09] border border-white shadow-md",

    ghost: "bg-transparent text-gray-400 hover:text-primary",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Liquid Shine Effect for Primary */}
      {variant === 'primary' && !isLoading && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
      )}
      
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};