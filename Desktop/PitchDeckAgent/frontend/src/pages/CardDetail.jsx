import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const CardDetail = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="container" style={{ display: 'grid', gap: 24 }}>
      <Card className="glow-accent" hoverable>
        <div style={{ padding: 28, display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Card Detail</h2>
          <p>This screen demonstrates depth: glossy edge, inner shadow, accent glow, and motion.</p>
          <div>
            <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
          </div>
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Example modal">
        <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 800 }}>Modal on Glass</h3>
        <p>Use this pattern for confirmations and rich content on a blurred backdrop.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default CardDetail;
