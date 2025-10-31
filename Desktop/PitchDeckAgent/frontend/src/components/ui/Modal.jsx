import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

const Modal = ({ open, onClose, children, ariaLabel }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={onClose}>
      <Card className="modal glow-accent" hoverable={false} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </Card>
    </div>
  );
};

Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
  ariaLabel: PropTypes.string,
};

export default Modal;
