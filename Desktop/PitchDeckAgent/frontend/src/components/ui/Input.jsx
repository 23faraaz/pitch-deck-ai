import React from 'react';
import PropTypes from 'prop-types';

const Input = ({ label, id, type = 'text', value, onChange, placeholder, disabled = false, required = false }) => {
  return (
    <label htmlFor={id} style={{ display: 'grid', gap: 8 }}>
      {label && <span style={{ fontWeight: 600 }}>{label}</span>}
      <input
        id={id}
        className="input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-required={required}
      />
    </label>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

export default Input;
