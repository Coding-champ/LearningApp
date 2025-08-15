import React, { useCallback } from 'react';
import { Tag, X, Download, Trash2, BookOpen, Brain, FileText } from 'lucide-react';

const LibraryView = ({ 
  cardSets,
  categories,
  selectedCategory,
  onCategoryChange,
  onDeleteCategory,
  onExportCardSet,
  onDeleteCardSet,
  onLoadCardSet,
  onStartFlashcards,
  onStartQuiz,
  onBackToOverview,
  onCreateFirst
}) => {
  const handleCategoryClick = useCallback((category) => {
    onCategoryChange(category);
  }, [onCategoryChange]);

  const handleDeleteCategory = useCallback((e, category) => {
    e.stopPropagation();
    onDeleteCategory(category);
  }, [onDeleteCategory]);

  const handleLoadAndStartFlashcards = useCallback((setId) => {
    onLoadCardSet(setId);
    onStartFlashcards();
  }, [onLoadCardSet, onStartFlashcards]);

  const handleLoadAndStartQuiz = useCallback((setId) => {
    onLoadCardSet(setId);
    onStartQuiz();
  }, [onLoadCardSet, onStartQuiz]);

  const filteredSets = cardSets ? 
    Object.values(cardSets)
      .filter(set => selectedCategory === 'Allgemein' || set.category === selectedCategory)
      .sort((a, b) => new Date(b.created) - new Date(a.created)) 
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lernset-Bibliothek</h2>
          <button
            onClick={onBackToOverview}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories && categories.map(category => {
              const setsInCategory = cardSets ? 
                Object.values(cardSets).filter(set => set.category === category).length : 0;
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  {category} ({setsInCategory})
                  {category !== 'Allgemein' && (
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer hover:text-red-300"
                      onClick={(e) => handleDeleteCategory(e, category)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Sets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSets.map(set => (
            <div key={set.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{set.title}</h3>
                  <p className="text-sm text-gray-600">{set.category}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onExportCardSet(set.id)}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Exportieren"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCardSet(set.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Karteikarten:</span>
                  <span>{set.flashcards ? set.flashcards.length : 0}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Quiz-Fragen:</span>
                  <span>{set.quizQuestions ? set.quizQuestions.length : 0}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Studiert:</span>
                  <span>{set.studyCount || 0} mal</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Erstellt:</span>
                  <span>{new Date(set.created).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadAndStartFlashcards(set.id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
                >
                  <BookOpen className="w-4 h-4" />
                  Lernen
                </button>
                <button
                  onClick={() => handleLoadAndStartQuiz(set.id)}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 text-sm flex items-center justify-center gap-1"
                >
                  <Brain className="w-4 h-4" />
                  Quiz
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSets.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Keine Lernsets in dieser Kategorie</p>
            <button
              onClick={onCreateFirst}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Erstes Lernset erstellen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LibraryView);