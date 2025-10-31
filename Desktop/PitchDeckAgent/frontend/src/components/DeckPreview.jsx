
import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import Button from './ui/Button';

const DeckPreview = ({ deck }) => {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleExport = async (type) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/export/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deck),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Export failed');
      }
      const data = await res.arrayBuffer();
      const blob = new Blob([data], { 
        type: type === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/pdf' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.title || 'deck'}.${type === 'pptx' ? 'pptx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Deck Preview</h2>
      {error && <div style={{ color: '#ff6b6b', marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'grid', gap: 16 }}>
        {deck?.slides?.map((slide) => (
          <div key={slide.id}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              <ReactMarkdown>{slide.title}</ReactMarkdown>
            </h3>
            <ul style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 6 }}>
              {slide.bullets?.map((bullet, idx) => (
                <li key={idx}>
                  <ReactMarkdown>{bullet}</ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button onClick={() => handleExport('pptx')} disabled={loading} variant="primary">Export to PPTX</Button>
        <Button onClick={() => handleExport('pdf')} disabled={loading}>Export to PDF</Button>
      </div>
    </div>
  );
};

DeckPreview.propTypes = {
  deck: PropTypes.shape({
    slides: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        bullets: PropTypes.arrayOf(PropTypes.string),
      })
    ),
  }).isRequired,
};

export default DeckPreview;
