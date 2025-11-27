import React from 'react';

const GlowOrb = ({ 
  size = 'medium',
  color = 'cyan',
  position = 'absolute',
  className = '',
  style = {},
  animate = true,
  ...props 
}) => {
  const sizeClasses = {
    small: 'glow-orb-small',
    medium: 'glow-orb-medium',
    large: 'glow-orb-large'
  };

  const colorClasses = {
    cyan: 'glow-orb-cyan',
    violet: 'glow-orb-violet',
    pink: 'glow-orb-pink'
  };

  const baseClasses = [
    'glow-orb',
    sizeClasses[size],
    colorClasses[color],
    animate && 'glow-orb-animate',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={baseClasses}
      style={{
        position: position,
        ...style
      }}
      {...props}
    />
  );
};

export default GlowOrb;