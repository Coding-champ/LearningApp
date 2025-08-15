import React, { useState, useCallback } from 'react';
import { Tag, Calendar, X, Check, RotateCcw } from 'lucide-react';

const FlashcardView = ({ 
  flashcards,
  currentCardIndex,
  onCardIndexChange,
  onMarkDifficult,
  onMarkUnderstood,
  onBackToOverview
}) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const nextCard = useCallback(() => {
    const nextIndex = (currentCardIndex + 1) % flashcards.length;
    onCardIndexChange(nextIndex);
    setShowAnswer(false);
  }, [currentCardIndex, flashcards.length, onCardIndexChange]);

  const prevCard = useCallback(() => {
    const prevIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
    onCardIndexChange(prevIndex);
    setShowAnswer(false);
  }, [currentCardIndex, flashcards.length, onCardIndexChange]);

  const handleMarkDifficult = useCallback(() => {
    if (onMarkDifficult) {
      onMarkDifficult(currentCardIndex);
    }
    nextCard();
  }, [onMarkDifficult, currentCardIndex, nextCard]);

  const handleMarkUnderstood = useCallback(() => {
    if (onMarkUnderstood) {
      onMarkUnderstood(currentCardIndex);
    }
    nextCard();
  }, [onMarkUnderstood, currentCardIndex, nextCard]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Keine Karteikarten verfügbar</h2>
          <p className="text-gray-600 mb-6">Es sind noch keine Karteikarten vorhanden.</p>
          <button
            onClick={onBackToOverview}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Karteikarten</h2>
          <span className="text-gray-600">{currentCardIndex + 1} / {flashcards.length}</span>
        </div>

        <div 
          onClick={() => setShowAnswer(!showAnswer)}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 min-h-[300px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow mb-6"
        >
          <div className="text-center">
            {!showAnswer ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Frage:</h3>
                <p className="text-lg text-gray-700">{currentCard?.question}</p>
                <p className="text-sm text-gray-500 mt-4">Klicke zum Umdrehen</p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-4">Antwort:</h3>
                <p className="text-lg text-gray-700">{currentCard?.answer}</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Metadata Display */}
        {currentCard && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {currentCard.tags && currentCard.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <div className="flex gap-1 flex-wrap">
                    {currentCard.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span>Schwierigkeit:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(level => (
                      <span 
                        key={level}
                        className={`w-2 h-2 rounded-full mr-1 ${
                          level <= (currentCard.difficulty || 1) 
                            ? 'bg-yellow-400' 
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {currentCard.createdAt ? 
                      new Date(currentCard.createdAt).toLocaleDateString() : 
                      'Unbekannt'
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    currentCard.createdBy === 'ai' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {currentCard.createdBy === 'ai' ? 'KI-erstellt' : 'Manuell'}
                  </span>
                </div>

                {currentCard.category && (
                  <div className="flex items-center gap-1">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {currentCard.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={prevCard}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center gap-2"
          >
            ← Vorherige
          </button>

          <div className="flex gap-2">
            {showAnswer && (
              <>
                <button
                  onClick={handleMarkDifficult}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Schwer
                </button>
                <button
                  onClick={handleMarkUnderstood}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Verstanden
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {showAnswer ? 'Frage zeigen' : 'Antwort zeigen'}
            </button>
          </div>

          <button
            onClick={nextCard}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center gap-2"
          >
            Nächste →
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToOverview}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FlashcardView);