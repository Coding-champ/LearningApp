import React, { useState } from 'react';
import { Plus, Save, X, Brain } from 'lucide-react';
import TagInput from './TagInput';

const ManualQuizCreator = ({ 
  onQuizCreated, 
  onCancel, 
  availableTags = [],
  onTagAdded,
  existingQuiz = []
}) => {
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    tags: [],
    difficulty: 1
  });
  const [createdQuestions, setCreatedQuestions] = useState(existingQuiz);

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleTagsChange = (newTags) => {
    setCurrentQuestion(prev => ({
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

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Bitte geben Sie eine Frage ein.');
      return;
    }

    const filledOptions = currentQuestion.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      alert('Bitte geben Sie mindestens 2 Antwortmöglichkeiten ein.');
      return;
    }

    if (!currentQuestion.options[currentQuestion.correct]?.trim()) {
      alert('Die als richtig markierte Antwort darf nicht leer sein.');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      question: currentQuestion.question.trim(),
      options: currentQuestion.options.map(opt => opt.trim()).filter(opt => opt),
      createdBy: 'manual',
      id: Date.now().toString()
    };

    // Adjust correct index if empty options were removed
    const originalCorrect = currentQuestion.correct;
    let adjustedCorrect = 0;
    let currentIndex = 0;
    
    for (let i = 0; i <= originalCorrect; i++) {
      if (currentQuestion.options[i]?.trim()) {
        if (i === originalCorrect) {
          adjustedCorrect = currentIndex;
          break;
        }
        currentIndex++;
      }
    }
    
    newQuestion.correct = adjustedCorrect;

    setCreatedQuestions(prev => [...prev, newQuestion]);
    
    // Reset form
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      tags: [],
      difficulty: 1
    });
  };

  const removeQuestion = (index) => {
    setCreatedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const editQuestion = (index) => {
    const questionToEdit = createdQuestions[index];
    // Pad options to always have 4 slots for editing
    const paddedOptions = [...questionToEdit.options];
    while (paddedOptions.length < 4) {
      paddedOptions.push('');
    }
    
    setCurrentQuestion({
      ...questionToEdit,
      options: paddedOptions
    });
    removeQuestion(index);
  };

  const saveQuestions = () => {
    if (createdQuestions.length === 0) {
      alert('Erstellen Sie mindestens eine Quizfrage.');
      return;
    }
    onQuizCreated(createdQuestions);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quizfragen erstellen</h2>
              <p className="text-gray-600">Erstellen Sie Ihre eigenen Multiple-Choice-Fragen</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Question Form */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Neue Quizfrage</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frage
              </label>
              <textarea
                value={currentQuestion.question}
                onChange={(e) => handleQuestionChange('question', e.target.value)}
                placeholder="Geben Sie Ihre Frage ein..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antwortmöglichkeiten
              </label>
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={currentQuestion.correct === index}
                      onChange={() => handleQuestionChange('correct', index)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium text-gray-700 w-6">
                      {String.fromCharCode(65 + index)})
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Antwortmöglichkeit ${String.fromCharCode(65 + index)}`}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Wählen Sie die richtige Antwort mit dem Radiobutton aus.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schwierigkeitsgrad
              </label>
              <select
                value={currentQuestion.difficulty}
                onChange={(e) => handleQuestionChange('difficulty', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value={1}>Einfach</option>
                <option value={2}>Mittel</option>
                <option value={3}>Schwer</option>
              </select>
            </div>

            <TagInput
              selectedTags={currentQuestion.tags}
              onTagsChange={handleTagsChange}
              availableTags={availableTags}
              placeholder="Tags für diese Frage..."
            />

            <button
              onClick={addQuestion}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Frage hinzufügen
            </button>
          </div>
        </div>

        {/* Created Questions List */}
        {createdQuestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Erstellte Fragen ({createdQuestions.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {createdQuestions.map((question, index) => (
                <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-2">
                        {question.question}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mb-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`flex items-center gap-2 ${
                            question.correct === optIndex ? 'text-green-600 font-medium' : ''
                          }`}>
                            <span>{String.fromCharCode(65 + optIndex)})</span>
                            <span>{option}</span>
                            {question.correct === optIndex && (
                              <span className="text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {question.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => editQuestion(index)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => removeQuestion(index)}
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
            onClick={saveQuestions}
            disabled={createdQuestions.length === 0}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Fragen speichern ({createdQuestions.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualQuizCreator;