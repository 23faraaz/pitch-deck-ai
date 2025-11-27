import React from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  hover = true, 
  glow = false,
  onClick,
  ...props 
}) => {
  const baseClasses = [
    'glass-card',
    hover && 'glass-card-hover',
    glow && 'glass-card-glow',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={baseClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;