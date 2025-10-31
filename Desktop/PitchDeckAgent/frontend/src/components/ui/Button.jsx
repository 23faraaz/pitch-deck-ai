import React, { useRef } from 'react';
import PropTypes from 'prop-types';

const Button = ({ children, className = '', variant = 'default', disabled = false, onClick, type = 'button', ariaLabel }) => {
  const ref = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    const host = ref.current;
    if (!host) return;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = host.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    host.appendChild(ripple);
    setTimeout(() => ripple.remove(), 450);
    onClick && onClick(e);
  };

  const classes = `button ${variant === 'primary' ? 'primary' : ''} ${className}`.trim();

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'primary']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  ariaLabel: PropTypes.string,
};

export default Button;
