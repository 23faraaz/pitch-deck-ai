import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ children, className = '', hoverable = true, onClick, role = 'region', ariaLabel }) => {
  const classes = `glass-card ${hoverable ? 'hoverable' : ''} ${className}`.trim();
  return (
    <div className={classes} onClick={onClick} role={role} aria-label={ariaLabel}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hoverable: PropTypes.bool,
  onClick: PropTypes.func,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Card;
