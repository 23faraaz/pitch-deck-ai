import React from 'react';
import PropTypes from 'prop-types';

const Navbar = ({ left, right }) => {
  return (
    <header className="navbar">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <div className="brand">PitchDeck Agent</div>
        <nav style={{ display: 'flex', gap: 12 }} aria-label="Primary">
          {left}
        </nav>
        <div style={{ display: 'flex', gap: 12 }}>
          {right}
        </div>
      </div>
    </header>
  );
};

Navbar.propTypes = {
  left: PropTypes.node,
  right: PropTypes.node,
};

export default Navbar;
