import React, { useState } from 'react';
import { Plus, Save, X, BookOpen } from 'lucide-react';
import TagInput from './TagInput';

const ManualCardCreator = ({ 
  onCardsCreated, 
  onCancel, 
  availableTags = [],
  onTagAdded,
  existingCards = [],
  selectedCategory = 'Allgemein'
}) => {
  const [currentCard, setCurrentCard] = useState({
    question: '',
    answer: '',
    tags: [],
    difficulty: 1
  });
  const [createdCards, setCreatedCards] = useState(existingCards);

  const handleCardChange = (field, value) => {
    setCurrentCard(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (newTags) => {
    setCurrentCard(prev => ({
      ...prev,
      tags: newTags
    }));
    
    // Add new tags to global tags
    newTags.forEach(tag => {
      if (!availableTags.includes(tag)) {
        onTagAdded(tag);
      }
    });
  };

  const addCard = () => {
    if (!currentCard.question.trim() || !currentCard.answer.trim()) {
      alert('Bitte füllen Sie sowohl Frage als auch Antwort aus.');
      return;
    }

    const newCard = {
      ...currentCard,
      question: currentCard.question.trim(),
      answer: currentCard.answer.trim(),
      createdBy: 'manual',
      createdAt: new Date(),
      category: selectedCategory,
      id: Date.now().toString()
    };

    setCreatedCards(prev => [...prev, newCard]);
    
    // Reset form
    setCurrentCard({
      question: '',
      answer: '',
      tags: [],
      difficulty: 1
    });
  };

  const removeCard = (index) => {
    setCreatedCards(prev => prev.filter((_, i) => i !== index));
  };

  const editCard = (index) => {
    setCurrentCard(createdCards[index]);
    removeCard(index);
  };

  const saveCards = () => {
    if (createdCards.length === 0) {
      alert('Erstellen Sie mindestens eine Karteikarte.');
      return;
    }
    onCardsCreated(createdCards);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Karteikarten erstellen</h2>
              <p className="text-gray-600">Erstellen Sie Ihre eigenen Lernkarten manuell</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Card Form */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Neue Karteikarte</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frage
              </label>
              <textarea
                value={currentCard.question}
                onChange={(e) => handleCardChange('question', e.target.value)}
                placeholder="Geben Sie Ihre Frage ein..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antwort
              </label>
              <textarea
                value={currentCard.answer}
                onChange={(e) => handleCardChange('answer', e.target.value)}
                placeholder="Geben Sie Ihre Antwort ein..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schwierigkeitsgrad
              </label>
              <select
                value={currentCard.difficulty}
                onChange={(e) => handleCardChange('difficulty', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Einfach</option>
                <option value={2}>Mittel</option>
                <option value={3}>Schwer</option>
              </select>
            </div>

            <TagInput
              selectedTags={currentCard.tags}
              onTagsChange={handleTagsChange}
              availableTags={availableTags}
              placeholder="Tags für diese Karte..."
            />

            <button
              onClick={addCard}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Karte hinzufügen
            </button>
          </div>
        </div>

        {/* Created Cards List */}
        {createdCards.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Erstellte Karten ({createdCards.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {createdCards.map((card, index) => (
                <div key={card.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">
                        {card.question}
                      </div>
                      <div className="text-gray-600 text-sm mb-2">
                        {card.answer}
                      </div>
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {card.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => editCard(index)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => removeCard(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700"
          >
            Abbrechen
          </button>
          <button
            onClick={saveCards}
            disabled={createdCards.length === 0}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Karten speichern ({createdCards.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualCardCreator;