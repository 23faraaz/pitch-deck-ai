import React, { useState } from 'react';
import DeckPreview from './DeckPreview';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';

const InputForm = () => {
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [goal, setGoal] = useState('');
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDeck(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, audience, tone, goal })
      });
      const data = await res.json();
      if (data.status === 'error') {
        // Show more detailed error information
        let errorMsg = data.message || 'API error';
        if (data.details) {
          errorMsg += `: ${data.details}`;
        }
        if (data.suggestion) {
          errorMsg += ` ${data.suggestion}`;
        }
        setError(errorMsg);
        console.error('Generation error:', data);
      } else {
        setDeck(data);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error('Network error:', err);
    }
  };

  return (
    <div className="container" style={{ display: 'grid', gap: 24 }}>
      <Card className="glow-accent">
        <div style={{ padding: 24, display: 'grid', gap: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Generate a Pitch Deck</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <Input id="idea" label="Idea" placeholder="Describe your idea" value={idea} onChange={e => setIdea(e.target.value)} required />
            <Input id="audience" label="Audience" placeholder="Who is the deck for?" value={audience} onChange={e => setAudience(e.target.value)} />
            <Input id="tone" label="Tone" placeholder="Tone (e.g., professional, playful)" value={tone} onChange={e => setTone(e.target.value)} />
            <Input id="goal" label="Goal" placeholder="What is the goal of the deck?" value={goal} onChange={e => setGoal(e.target.value)} />
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <Button type="submit" variant="primary">Generate Deck</Button>
            </div>
          </form>
          {error && <div role="alert" style={{ color: '#ff6b6b', fontWeight: 600 }}>{error}</div>}
        </div>
      </Card>
      {deck && (
        <Card>
          <div style={{ padding: 24 }}>
            <DeckPreview deck={deck} />
          </div>
        </Card>
      )}
    </div>
  );
};

export default InputForm;
