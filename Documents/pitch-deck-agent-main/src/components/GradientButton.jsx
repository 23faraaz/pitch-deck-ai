import React from 'react';

const GradientButton = ({ 
  children, 
  variant = 'primary',
  size = 'default',
  className = '', 
  glow = true,
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) => {
  const baseClasses = [
    'gradient-button',
    `gradient-button-${variant}`,
    `gradient-button-${size}`,
    glow && 'gradient-button-glow',
    disabled && 'gradient-button-disabled',
    loading && 'gradient-button-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="gradient-button-spinner">
          <div className="spinner"></div>
        </div>
      )}
      <span className="gradient-button-content">
        {children}
      </span>
      {glow && <div className="gradient-button-glow-bg"></div>}
    </button>
  );
};

export default GradientButton;