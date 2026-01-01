import React, { useState, useEffect, useMemo } from 'react';
import flashcardsData from './data/flashcards.json';

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Group cards by category for the home screen
  const categories = useMemo(() => {
    const cats = [...new Set(flashcardsData.map(c => c.category))];
    return cats.map(name => ({
      name,
      count: flashcardsData.filter(c => c.category === name).length,
      icon: getCategoryIcon(name)
    }));
  }, []);

  const filteredCards = useMemo(() => {
    return flashcardsData.filter(c => c.category === selectedCategory);
  }, [selectedCategory]);

  const activeCard = activeCardIndex !== null ? filteredCards[activeCardIndex] : null;

  function getCategoryIcon(name) {
    const icons = {
      'Family': '👨‍👩‍👧‍👦',
      'Food': '🍎',
      'Animals': '🦁',
      'Actions': '🏃',
      'Nature': '🌲',
      'Colors': '🎨',
      'Numbers': '🔢',
      'Body Parts': '👤',
      'Objects': '📦'
    };
    return icons[name] || '📁';
  }

  // Effect to warm up voices
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Find BEST available voice
    // 1. Precise Marathi
    // 2. Any Marathi
    // 3. Precise Hindi (Fallback)
    // 4. Any Hindi (Fallback)
    let voice = voices.find(v => v.lang === 'mr-IN');
    if (!voice) voice = voices.find(v => v.lang.startsWith('mr'));
    if (!voice) voice = voices.find(v => v.lang === 'hi-IN');
    if (!voice) voice = voices.find(v => v.lang.startsWith('hi'));

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'mr-IN';
    }

    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const getImagePath = (path) => {
    if (!path) return '';
    const base = import.meta.env.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const finalPath = `${normalizedBase}${normalizedPath}`;

    // Debug log to help identify why images aren't loading
    if (path.includes('family')) {
      console.log(`[ImageDebug] Input: ${path}, Base: ${base}, Final: ${finalPath}`);
    }

    return finalPath;
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const closeExpanded = () => {
    setActiveCardIndex(null);
    setIsFlipped(false);
  };

  return (
    <div id="root">
      <header className="app-header">
        <div className="brand" onClick={() => setSelectedCategory(null)} style={{ cursor: 'pointer' }}>
          <h1>Marathi Flashcards</h1>
        </div>
        {selectedCategory && (
          <button className="nav-btn" onClick={() => setSelectedCategory(null)}>
            ← Back to Home
          </button>
        )}
      </header>

      <main className="main-content">
        {!selectedCategory ? (
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="category-card"
                onClick={() => setSelectedCategory(cat.name)}
              >
                <div className="category-icon">{cat.icon}</div>
                <div className="category-info">
                  <h2>{cat.name}</h2>
                  <p>{cat.count} Flashcards</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-grid">
            {filteredCards.map((card, index) => (
              <div
                key={card.id}
                className="mini-card"
                onClick={() => setActiveCardIndex(index)}
              >
                <img
                  src={getImagePath(card.imagePath)}
                  alt={card.english}
                  className="mini-card-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Generating...'; }}
                />
                <div className="mini-card-title">{card.english}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {activeCard && (
        <div className="modal-overlay" onClick={closeExpanded}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeExpanded}>×</button>

            <div className="flashcard-main">
              <div
                className={`card-flip-wrap ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <div className="side side-front">
                  <img
                    src={getImagePath(activeCard.imagePath)}
                    alt={activeCard.english}
                    className="main-image"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Coming+Soon'; }}
                  />
                  <h2 className="main-english">{activeCard.english}</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Tap to flip</p>
                </div>

                {/* Back */}
                <div className="side side-back">
                  <div className="marathi-container">
                    <h2 className="main-marathi">{activeCard.marathi}</h2>
                    <button
                      className="speaker-btn main-speaker"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(activeCard.marathi);
                      }}
                    >
                      🔊
                    </button>
                  </div>
                  <p className="translit">{activeCard.transliteration}</p>

                  <div className="phonetics">
                    <span className="first-let">{activeCard.firstLetter}</span>
                    <button
                      className="speaker-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(activeCard.firstLetter);
                      }}
                    >
                      🔊
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="nav-buttons">
              <button className="nav-btn" onClick={handlePrev}>
                <span>←</span> {filteredCards[(activeCardIndex - 1 + filteredCards.length) % filteredCards.length].english}
              </button>
              <button className="nav-btn" onClick={handleNext}>
                {filteredCards[(activeCardIndex + 1) % filteredCards.length].english} <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
