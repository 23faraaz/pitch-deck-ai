import { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';

const SlideEditor = ({ deckData, onClose, onSave }) => {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editingSlide, setEditingSlide] = useState(null);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (deckData?.deck?.slides) {
      setSlides([...deckData.deck.slides]);
    }
  }, [deckData]);

  const currentSlide = slides[currentSlideIndex] || {};

  const updateSlide = (updates) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = {
      ...newSlides[currentSlideIndex],
      ...updates
    };
    setSlides(newSlides);
    setIsModified(true);
  };

  const updateSlideContent = (field, value) => {
    updateSlide({
      [field]: value
    });
  };

  const addNewSlide = () => {
    const newSlide = {
      title: 'New Slide',
      type: 'content',
      content: 'Enter your content here...',
      speakerNotes: '',
      layout: 'title-content'
    };
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setCurrentSlideIndex(newSlides.length - 1);
    setIsModified(true);
  };

  const deleteSlide = (index) => {
    if (slides.length <= 1) return; // Don't delete the last slide
    
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
    setIsModified(true);
  };

  const duplicateSlide = (index) => {
    const slideToClone = { ...slides[index] };
    slideToClone.title = `${slideToClone.title} (Copy)`;
    
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, slideToClone);
    setSlides(newSlides);
    setCurrentSlideIndex(index + 1);
    setIsModified(true);
  };

  const moveSlide = (fromIndex, toIndex) => {
    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    setSlides(newSlides);
    setCurrentSlideIndex(toIndex);
    setIsModified(true);
  };

  const handleSave = () => {
    const updatedDeck = {
      ...deckData.deck,
      slides: slides
    };
    onSave(updatedDeck);
    setIsModified(false);
  };

  const exportToPowerPoint = async () => {
    try {
      const response = await fetch('/api/export/generate-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deckId: deckData.deckId,
          slides: slides
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deckData.deck.metadata.deckTitle || 'pitch-deck'}.pptx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PowerPoint export error:', error);
    }
  };

  return (
    <div className="slide-editor-overlay">
      <div className="slide-editor-container">
        {/* Header */}
        <div className="slide-editor-header">
          <div className="editor-title">
            <h2>🎨 PowerPoint Editor</h2>
            <span className="deck-title">{deckData.deck?.metadata?.deckTitle || 'Untitled Deck'}</span>
          </div>
          
          <div className="editor-actions">
            {isModified && (
              <GradientButton
                onClick={handleSave}
                size="small"
                variant="secondary"
              >
                💾 Save Changes
              </GradientButton>
            )}
            
            <GradientButton
              onClick={exportToPowerPoint}
              size="small"
            >
              📊 Export PPT
            </GradientButton>
            
            <button
              onClick={onClose}
              className="close-editor-btn"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="slide-editor-content">
          {/* Slide Thumbnails Sidebar */}
          <div className="slides-sidebar">
            <div className="sidebar-header">
              <h3>Slides ({slides.length})</h3>
              <button
                onClick={addNewSlide}
                className="add-slide-btn"
                title="Add New Slide"
              >
                ➕
              </button>
            </div>
            
            <div className="slides-list">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`slide-thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSlideIndex(index)}
                >
                  <div className="thumbnail-number">{index + 1}</div>
                  <div className="thumbnail-content">
                    <div className="thumbnail-title">{slide.title || 'Untitled'}</div>
                    <div className="thumbnail-preview">
                      {slide.content ? slide.content.substring(0, 50) + '...' : 'No content'}
                    </div>
                  </div>
                  <div className="thumbnail-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(index);
                      }}
                      title="Duplicate"
                      className="thumbnail-action"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      title="Delete"
                      className="thumbnail-action delete"
                      disabled={slides.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="slide-main-editor">
            {currentSlide && (
              <GlassCard className="slide-edit-card">
                <div className="slide-navigation">
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    className="nav-btn"
                  >
                    ← Previous
                  </button>
                  
                  <span className="slide-counter">
                    Slide {currentSlideIndex + 1} of {slides.length}
                  </span>
                  
                  <button
                    onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === slides.length - 1}
                    className="nav-btn"
                  >
                    Next →
                  </button>
                </div>

                <div className="slide-edit-form">
                  <div className="form-group">
                    <label className="form-label">Slide Title</label>
                    <input
                      type="text"
                      value={currentSlide.title || ''}
                      onChange={(e) => updateSlideContent('title', e.target.value)}
                      className="form-input"
                      placeholder="Enter slide title..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Slide Type</label>
                    <select
                      value={currentSlide.type || 'content'}
                      onChange={(e) => updateSlideContent('type', e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="title">Title Slide</option>
                      <option value="content">Content Slide</option>
                      <option value="bullet">Bullet Points</option>
                      <option value="image">Image Slide</option>
                      <option value="chart">Chart/Data</option>
                      <option value="quote">Quote Slide</option>
                      <option value="closing">Closing Slide</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content</label>
                    <textarea
                      value={currentSlide.content || ''}
                      onChange={(e) => updateSlideContent('content', e.target.value)}
                      className="form-input form-textarea"
                      rows="8"
                      placeholder="Enter slide content..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Speaker Notes</label>
                    <textarea
                      value={currentSlide.speakerNotes || ''}
                      onChange={(e) => updateSlideContent('speakerNotes', e.target.value)}
                      className="form-input form-textarea"
                      rows="3"
                      placeholder="Add speaker notes (optional)..."
                    />
                  </div>

                  <div className="slide-actions">
                    <div className="move-actions">
                      <button
                        onClick={() => moveSlide(currentSlideIndex, Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                        className="action-btn"
                      >
                        ↑ Move Up
                      </button>
                      <button
                        onClick={() => moveSlide(currentSlideIndex, Math.min(slides.length - 1, currentSlideIndex + 1))}
                        disabled={currentSlideIndex === slides.length - 1}
                        className="action-btn"
                      >
                        ↓ Move Down
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;