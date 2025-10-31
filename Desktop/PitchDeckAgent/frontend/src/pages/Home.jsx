import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Home = () => {
  return (
    <div className="container" style={{ display: 'grid', gap: 24 }}>
      <Card className="glow-accent">
        <div style={{ padding: 28, display: 'grid', gap: 14 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800 }}>Design premium decks with liquid-glass UI</h1>
          <p>Generate, preview, and export pitch decks with a tactile, modern interface.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="#/dashboard" className="button primary">Get Started</a>
            <a href="#/detail" className="button">View Card Detail</a>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {[1,2,3].map((i) => (
          <Card key={i} className="hoverable">
            <div style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Floating card {i}</h3>
              <p>Translucent, blurred, and glossy with subtle inner shadow and glow.</p>
              <div style={{ marginTop: 12 }}>
                <Button>Learn more</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Home;
