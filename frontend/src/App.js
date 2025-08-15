import React, { useState, useCallback, useMemo } from 'react';
import { Upload, BookOpen, Brain, RotateCcw, Plus, Download, Upload as UploadIcon, BarChart3, FileText } from 'lucide-react';
import { extractTextFromPDF } from './utils/pdfToText';
import { generateContentWithAI } from './utils/generateContentWithAI';
import ContentTypeSelector from './components/ContentTypeSelector';
import ManualCardCreator from './components/ManualCardCreator';
import ManualQuizCreator from './components/ManualQuizCreator';
import TagManager from './components/TagManager';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import StatisticsView from './components/StatisticsView';
import LibraryView from './components/LibraryView';

// Custom Hooks
import useSpacedRepetition from './hooks/useSpacedRepetition';
import useQuizLogic from './hooks/useQuizLogic';
import useStatistics from './hooks/useStatistics';
import useCardSets from './hooks/useCardSets';

const StudyApp = () => {
  // Core UI state
  const [currentView, setCurrentView] = useState('upload');
  const [uploadedContent, setUploadedContent] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  
  // Content state
  const [flashcards, setFlashcards] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // Enhanced card creation system state
  const [globalTags, setGlobalTags] = useState([]);
  const [creationMode, setCreationMode] = useState('auto');
  const [contentTypeSelection, setContentTypeSelection] = useState('both');

  // Custom Hooks
  const spacedRepetition = useSpacedRepetition();
  const quizLogic = useQuizLogic();
  const statistics = useStatistics();
  const cardSets = useCardSets();

  // Tag Management Functions
  const addTag = useCallback((tagName) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !globalTags.includes(trimmedTag)) {
      setGlobalTags(prev => [...prev, trimmedTag]);
      return true;
    }
    return false;
  }, [globalTags]);

  const removeTag = useCallback((tagName) => {
    setGlobalTags(prev => prev.filter(tag => tag !== tagName));
    setFlashcards(prev => prev.map(card => ({
      ...card,
      tags: card.tags ? card.tags.filter(tag => tag !== tagName) : []
    })));
    setQuizQuestions(prev => prev.map(question => ({
      ...question,
      tags: question.tags ? question.tags.filter(tag => tag !== tagName) : []
    })));
  }, []);

  const renameTag = useCallback((oldTagName, newTagName) => {
    const trimmedNewTag = newTagName.trim().toLowerCase();
    if (trimmedNewTag && !globalTags.includes(trimmedNewTag)) {
      setGlobalTags(prev => prev.map(tag => tag === oldTagName ? trimmedNewTag : tag));
      setFlashcards(prev => prev.map(card => ({
        ...card,
        tags: card.tags ? card.tags.map(tag => tag === oldTagName ? trimmedNewTag : tag) : []
      })));
      setQuizQuestions(prev => prev.map(question => ({
        ...question,
        tags: question.tags ? question.tags.map(tag => tag === oldTagName ? trimmedNewTag : tag) : []
      })));
    }
  }, [globalTags]);

  // File Upload Handler
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      let content = '';
      if (file.type === 'application/pdf') {
        content = await extractTextFromPDF(file);
      } else {
        content = await file.text();
      }
      
      if (creationMode === 'auto') {
        const { flashcards: newFlashcards, quiz: newQuiz } = await generateContentWithAI(content);
        if (contentTypeSelection === 'flashcards' || contentTypeSelection === 'both') {
          setFlashcards(newFlashcards);
        }
        if (contentTypeSelection === 'quiz' || contentTypeSelection === 'both') {
          setQuizQuestions(newQuiz);
        }
        
        const title = `${file.name.split('.')[0]} - ${new Date().toLocaleDateString()}`;
        cardSets.saveCurrentSet(title, newFlashcards, newQuiz, cardSets.selectedCategory);
        setCurrentView('overview');
      }
    } catch (error) {
      alert('Fehler beim Verarbeiten der Datei: ' + error.message);
    }
  }, [creationMode, contentTypeSelection, cardSets]);

  // Content Generation from Text
  const generateContentFromText = useCallback(async () => {
    if (!uploadedContent.trim()) {
      alert('Bitte fügen Sie zuerst Inhalte hinzu.');
      return;
    }

    try {
      const { flashcards: newFlashcards, quiz: newQuiz } = await generateContentWithAI(uploadedContent);
      if (contentTypeSelection === 'flashcards' || contentTypeSelection === 'both') {
        setFlashcards(newFlashcards);
      }
      if (contentTypeSelection === 'quiz' || contentTypeSelection === 'both') {
        setQuizQuestions(newQuiz);
      }
      
      const title = `Textinhalt ${new Date().toLocaleDateString()}`;
      cardSets.saveCurrentSet(title, newFlashcards, newQuiz, cardSets.selectedCategory);
      setCurrentView('overview');
    } catch (error) {
      alert('Fehler bei der KI-Generierung: ' + error.message);
    }
  }, [uploadedContent, contentTypeSelection, cardSets]);

  // Manual Content Creation Functions
  const handleManualCardsCreated = useCallback((cards) => {
    const updatedCards = [...flashcards, ...cards];
    setFlashcards(updatedCards);
    
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => addTag(tag));
      }
    });
    
    if (contentTypeSelection === 'flashcards') {
      const title = `Manuelle Karten ${new Date().toLocaleDateString()}`;
      cardSets.saveCurrentSet(title, updatedCards, quizQuestions, cardSets.selectedCategory);
      setCurrentView('overview');
    } else if (contentTypeSelection === 'both') {
      setCurrentView('manual-quiz-creation');
    }
  }, [contentTypeSelection, flashcards, quizQuestions, cardSets, addTag]);

  const handleManualQuizCreated = useCallback((questions) => {
    const updatedQuestions = [...quizQuestions, ...questions];
    setQuizQuestions(updatedQuestions);
    
    questions.forEach(question => {
      if (question.tags) {
        question.tags.forEach(tag => addTag(tag));
      }
    });
    
    const title = `Manueller Inhalt ${new Date().toLocaleDateString()}`;
    cardSets.saveCurrentSet(title, flashcards, updatedQuestions, cardSets.selectedCategory);
    setCurrentView('overview');
  }, [flashcards, quizQuestions, cardSets, addTag]);

  // Quiz Handler Functions
  const handleQuizAnswer = useCallback((answerIndex) => {
    setSelectedAnswer(answerIndex);
  }, []);

  const startAdaptiveQuiz = useCallback((mode = 'adaptive') => {
    const questions = quizLogic.getQuestionsForQuiz(quizQuestions, cardSets.currentSetId, mode);
    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizAnswers([]);
    setSelectedAnswer('');
    quizLogic.setQuizMode(mode);
    setCurrentView('quiz');
  }, [quizLogic, quizQuestions, cardSets.currentSetId]);

  const submitQuizAnswer = useCallback(() => {
    const currentQuestion = quizQuestions[currentQuizIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct;
    
    setQuizAnswers(prev => [...prev, {
      questionIndex: currentQuizIndex,
      selectedAnswer,
      correctAnswer: currentQuestion.correct,
      isCorrect
    }]);
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    
    // Update question progress
    const questionId = `${cardSets.currentSetId}_quiz_${currentQuizIndex}`;
    quizLogic.updateQuestionProgress(questionId, isCorrect);
    
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      // Quiz completed
      const finalScore = quizScore + (isCorrect ? 1 : 0);
      const percentage = Math.round((finalScore / quizQuestions.length) * 100);
      
      statistics.addQuizResult({
        score: finalScore,
        totalQuestions: quizQuestions.length,
        percentage,
        mode: quizLogic.quizMode,
        setTitle: 'Current Quiz'
      });
      
      setCurrentView('quiz-results');
    }
  }, [currentQuizIndex, quizQuestions, selectedAnswer, quizScore, cardSets.currentSetId, quizLogic, statistics]);

  // Flashcard Handler Functions
  const markCardDifficult = useCallback(() => {
    const cardId = `${cardSets.currentSetId}_${currentCardIndex}`;
    spacedRepetition.updateCardProgress(cardId, false);
    statistics.addStudySession();
  }, [currentCardIndex, cardSets.currentSetId, spacedRepetition, statistics]);

  const markCardUnderstood = useCallback(() => {
    const cardId = `${cardSets.currentSetId}_${currentCardIndex}`;
    spacedRepetition.updateCardProgress(cardId, true);
    statistics.addStudySession();
  }, [currentCardIndex, cardSets.currentSetId, spacedRepetition, statistics]);

  const resetQuiz = useCallback(() => {
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizAnswers([]);
    setSelectedAnswer('');
    setCurrentView('quiz-selection');
  }, []);

  // Category management
  const addCategory = useCallback(() => {
    if (cardSets.addCategory(newCategoryName)) {
      setNewCategoryName('');
      setShowCategoryInput(false);
    }
  }, [newCategoryName, cardSets]);

  // Memoized values for performance
  const cardsForReview = useMemo(() => 
    spacedRepetition.getCardsForReview(flashcards, cardSets.currentSetId),
    [spacedRepetition, flashcards, cardSets.currentSetId]
  );

  // Import handler with callback functions
  const handleImport = useCallback((event) => {
    cardSets.importCardSets(
      event,
      (stats) => statistics.setStatistics(stats),
      (cats) => cardSets.setCategories(prev => [...new Set([...prev, ...cats])])
    );
  }, [cardSets, statistics]);

  // Render Functions
  const renderUploadView = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">StudyMaster</h1>
        
        <ContentTypeSelector
          selectedType={contentTypeSelection}
          onTypeChange={setContentTypeSelection}
          className="mb-8"
        />

        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie auswählen:</label>
          <div className="flex gap-2 items-center">
            <select
              value={cardSets.selectedCategory}
              onChange={(e) => cardSets.setSelectedCategory(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {cardSets.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryInput(!showCategoryInput)}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showCategoryInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Neue Kategorie"
                className="flex-1 p-2 border border-gray-300 rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Hinzufügen
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Erstellungsmodus:</label>
          <div className="flex gap-4">
            <button
              onClick={() => setCreationMode('auto')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                creationMode === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Brain className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Automatisch</div>
                <div className="text-sm text-gray-600">KI erstellt Inhalte</div>
              </div>
            </button>
            <button
              onClick={() => setCreationMode('manual')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                creationMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Plus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Manuell</div>
                <div className="text-sm text-gray-600">Selbst eingeben</div>
              </div>
            </button>
          </div>
        </div>

        {creationMode === 'auto' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">Datei hochladen (Text oder PDF)</p>
                <input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500"
                />
              </div>
              <div className="text-gray-500 my-4">oder</div>
              <div className="space-y-4">
                <textarea
                  value={uploadedContent}
                  onChange={(e) => setUploadedContent(e.target.value)}
                  className="w-full h-32 p-4 border rounded-xl"
                  placeholder="Füge hier deinen Text ein..."
                />
                <button
                  onClick={generateContentFromText}
                  className="bg-green-600 text-white py-3 px-6 rounded-xl"
                >
                  Inhalte generieren
                </button>
              </div>
            </div>
          </div>
        )}

        {creationMode === 'manual' && (
          <div className="text-center">
            <button
              onClick={() => setCurrentView('manual-creation')}
              className="bg-green-600 text-white py-3 px-6 rounded-xl"
            >
              Manuell erstellen
            </button>
          </div>
        )}

        <TagManager
          tags={globalTags}
          onTagAdded={addTag}
          onTagRemoved={removeTag}
          onTagRenamed={renameTag}
          className="mt-6"
        />

        <div className="flex gap-4 mt-6">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <UploadIcon className="w-4 h-4" />
            Sets importieren
          </label>
          <button
            onClick={() => cardSets.exportAllSets(statistics.statistics)}
            disabled={Object.keys(cardSets.cardSets).length === 0}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Alle exportieren
          </button>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('statistics')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Statistiken
            </button>
            <button
              onClick={() => setCurrentView('library')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Bibliothek
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div 
            onClick={() => setCurrentView('flashcards')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-10 h-10" />
              <span className="text-2xl font-bold">{cardsForReview.length}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Zu wiederholende Karten</h3>
            <p className="text-blue-100">Basierend auf Spaced Repetition</p>
          </div>

          <div 
            onClick={() => setCurrentView('quiz-selection')}
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-10 h-10" />
              <span className="text-2xl font-bold">
                {quizLogic.getQuestionsForQuiz(quizQuestions, cardSets.currentSetId, 'adaptive').length}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Intelligentes Quiz</h3>
            <p className="text-orange-100">Adaptive Fragen bereit</p>
          </div>

          <div 
            onClick={() => setCurrentView('statistics')}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-10 h-10" />
              <span className="text-2xl font-bold">{statistics.statistics.totalCardsStudied}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Karten studiert</h3>
            <p className="text-green-100">Dein Lernfortschritt</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentView('upload')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Neues Lernset erstellen
          </button>
        </div>
      </div>
    </div>
  );

  const renderManualCreation = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Was möchten Sie erstellen?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => {
              if (contentTypeSelection === 'flashcards' || contentTypeSelection === 'both') {
                setCurrentView('manual-card-creation');
              } else {
                setCurrentView('manual-quiz-creation');
              }
            }}
            disabled={contentTypeSelection === 'quiz'}
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl disabled:opacity-50"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Karteikarten erstellen</h3>
          </button>
          
          <button
            onClick={() => {
              if (contentTypeSelection === 'quiz' || contentTypeSelection === 'both') {
                setCurrentView('manual-quiz-creation');
              } else {
                setCurrentView('manual-card-creation');
              }
            }}
            disabled={contentTypeSelection === 'flashcards'}
            className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl disabled:opacity-50"
          >
            <Brain className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Quiz erstellen</h3>
          </button>
        </div>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentView('upload')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Zurück zur Upload-Ansicht
          </button>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 py-8 px-4">
      {currentView === 'upload' && renderUploadView()}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'manual-creation' && renderManualCreation()}
      
      {currentView === 'manual-card-creation' && (
        <ManualCardCreator
          onCardsCreated={handleManualCardsCreated}
          onCancel={() => setCurrentView('manual-creation')}
          availableTags={globalTags}
          onTagAdded={addTag}
          existingCards={flashcards}
          selectedCategory={cardSets.selectedCategory}
        />
      )}
      
      {currentView === 'manual-quiz-creation' && (
        <ManualQuizCreator
          onQuizCreated={handleManualQuizCreated}
          onCancel={() => {
            if (contentTypeSelection === 'both' && flashcards.length > 0) {
              setCurrentView('manual-creation');
            } else {
              setCurrentView('upload');
            }
          }}
          availableTags={globalTags}
          onTagAdded={addTag}
          existingQuiz={quizQuestions}
          selectedCategory={cardSets.selectedCategory}
        />
      )}

      {currentView === 'library' && (
        <LibraryView
          cardSets={cardSets.cardSets}
          categories={cardSets.categories}
          selectedCategory={cardSets.selectedCategory}
          onCategoryChange={cardSets.setSelectedCategory}
          onDeleteCategory={cardSets.deleteCategory}
          onExportCardSet={cardSets.exportCardSet}
          onDeleteCardSet={cardSets.deleteCardSet}
          onLoadCardSet={(setId) => {
            const set = cardSets.loadCardSet(setId);
            if (set) {
              setFlashcards(set.flashcards);
              setQuizQuestions(set.quizQuestions);
            }
          }}
          onStartFlashcards={() => setCurrentView('flashcards')}
          onStartQuiz={() => setCurrentView('quiz-selection')}
          onBackToOverview={() => setCurrentView('overview')}
          onCreateFirst={() => setCurrentView('upload')}
        />
      )}

      {currentView === 'statistics' && (
        <StatisticsView
          statistics={statistics.statistics}
          quizProgress={quizLogic.quizProgress}
          categories={cardSets.categories}
          cardSets={cardSets.cardSets}
          quizHistory={statistics.quizHistory}
          onBackToOverview={() => setCurrentView('overview')}
        />
      )}

      {currentView === 'flashcards' && (
        <FlashcardView
          flashcards={flashcards}
          currentCardIndex={currentCardIndex}
          onCardIndexChange={setCurrentCardIndex}
          onMarkDifficult={markCardDifficult}
          onMarkUnderstood={markCardUnderstood}
          onBackToOverview={() => setCurrentView('overview')}
        />
      )}

      {(currentView === 'quiz-selection' || currentView === 'quiz' || currentView === 'quiz-results') && (
        <QuizView
          view={currentView}
          quizQuestions={quizQuestions}
          currentQuizIndex={currentQuizIndex}
          selectedAnswer={selectedAnswer}
          quizScore={quizScore}
          quizAnswers={quizAnswers}
          quizMode={quizLogic.quizMode}
          getQuestionsForQuiz={(mode) => quizLogic.getQuestionsForQuiz(quizQuestions, cardSets.currentSetId, mode)}
          getQuestionDifficulty={quizLogic.getQuestionDifficulty}
          quizProgress={quizLogic.quizProgress}
          statistics={statistics.statistics}
          quizHistory={statistics.quizHistory}
          onModeSelect={startAdaptiveQuiz}
          onAnswerSelect={handleQuizAnswer}
          onSubmitAnswer={submitQuizAnswer}
          onResetQuiz={resetQuiz}
          onBackToOverview={() => setCurrentView('overview')}
          onBackToSelection={() => setCurrentView('quiz-selection')}
        />
      )}
    </div>
  );
};

export default StudyApp;