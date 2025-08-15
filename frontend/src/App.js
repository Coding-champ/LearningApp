import React, { useState } from 'react';
import { Upload, BookOpen, Brain, RotateCcw, Check, X, FileText, Award, Plus, Download, Upload as UploadIcon, BarChart3, Calendar, Tag, Trash2, Edit } from 'lucide-react';
import { extractTextFromPDF } from './utils/pdfToText';
import { generateContentWithAI } from './utils/generateContentWithAI';
import ContentTypeSelector from './components/ContentTypeSelector';
import ManualCardCreator from './components/ManualCardCreator';
import ManualQuizCreator from './components/ManualQuizCreator';

const StudyApp = () => {
  const [currentView, setCurrentView] = useState('upload');
  const [uploadedContent, setUploadedContent] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  
  // Neue State-Variablen für erweiterte Funktionen
  const [cardSets, setCardSets] = useState({});
  const [currentSetId, setCurrentSetId] = useState(null);
  const [categories, setCategories] = useState(['Allgemein']);
  const [selectedCategory, setSelectedCategory] = useState('Allgemein');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [cardProgress, setCardProgress] = useState({});
  const [quizProgress, setQuizProgress] = useState({}); // Neu für Quiz-Fortschritt
  const [quizMode, setQuizMode] = useState('adaptive'); // 'adaptive', 'random', 'difficult'
  const [quizHistory, setQuizHistory] = useState([]);
  const [statistics, setStatistics] = useState({
    totalStudySessions: 0,
    totalCardsStudied: 0,
    totalQuizzesTaken: 0,
    totalQuizQuestions: 0,
    averageScore: 0,
    studyStreak: 0
  });

  // Enhanced card creation system state
  const [globalTags, setGlobalTags] = useState([]); // All available tags
  const [creationMode, setCreationMode] = useState('auto'); // 'manual' | 'auto'
  const [contentTypeSelection, setContentTypeSelection] = useState('both'); // 'flashcards' | 'quiz' | 'both'

  // Quiz-spezifische Spaced Repetition
  const getQuestionDifficulty = (questionId) => {
    return quizProgress[questionId]?.difficulty || 1;
  };

  const updateQuestionProgress = (questionId, wasCorrect, timeTaken = 0) => {
    const currentProgress = quizProgress[questionId] || {
      difficulty: 1,
      lastAnswered: new Date(),
      answerCount: 0,
      correctCount: 0,
      incorrectStreak: 0,
      averageTime: 0,
      nextReview: new Date()
    };

    const newProgress = {
      ...currentProgress,
      answerCount: currentProgress.answerCount + 1,
      correctCount: wasCorrect ? currentProgress.correctCount + 1 : currentProgress.correctCount,
      incorrectStreak: wasCorrect ? 0 : currentProgress.incorrectStreak + 1,
      lastAnswered: new Date(),
      averageTime: (currentProgress.averageTime * currentProgress.answerCount + timeTaken) / (currentProgress.answerCount + 1)
    };

    // Adaptive Schwierigkeit basierend auf Performance
    if (wasCorrect) {
      if (newProgress.incorrectStreak === 0) {
        newProgress.difficulty = Math.min(newProgress.difficulty + 0.5, 5);
      }
      const daysToAdd = Math.pow(1.8, newProgress.difficulty - 1);
      newProgress.nextReview = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      newProgress.difficulty = Math.max(newProgress.difficulty - 0.8, 0.5);
      // Falsche Antworten früher wiederholen
      newProgress.nextReview = new Date(Date.now() + Math.max(1, newProgress.difficulty) * 12 * 60 * 60 * 1000);
    }

    setQuizProgress(prev => ({
      ...prev,
      [questionId]: newProgress
    }));
  };

  const getQuestionsForQuiz = (mode = quizMode, maxQuestions = 10) => {
    const now = new Date();
    let availableQuestions = quizQuestions.map((q, index) => ({
      ...q,
      originalIndex: index,
      id: `${currentSetId}_quiz_${index}`,
      progress: quizProgress[`${currentSetId}_quiz_${index}`]
    }));

    switch (mode) {
      case 'adaptive':
        // Priorität: schwierige Fragen und Fragen zur Wiederholung
        availableQuestions = availableQuestions
          .filter(q => !q.progress || q.progress.nextReview <= now)
          .sort((a, b) => {
            const aDifficulty = a.progress?.difficulty || 1;
            const bDifficulty = b.progress?.difficulty || 1;
            const aIncorrectStreak = a.progress?.incorrectStreak || 0;
            const bIncorrectStreak = b.progress?.incorrectStreak || 0;
            
            // Priorisiere Fragen mit hoher Fehlstreak und niedriger Schwierigkeit
            return (bIncorrectStreak - aIncorrectStreak) || (aDifficulty - bDifficulty);
          });
        break;
        
      case 'difficult':
        // Nur schwierige Fragen (niedrige Schwierigkeit = oft falsch beantwortet)
        availableQuestions = availableQuestions
          .filter(q => q.progress && q.progress.difficulty < 2)
          .sort((a, b) => (a.progress?.difficulty || 5) - (b.progress?.difficulty || 5));
        break;
        
      case 'random':
      default:
        // Zufällige Reihenfolge
        availableQuestions = availableQuestions.sort(() => Math.random() - 0.5);
        break;
    }

    return availableQuestions.slice(0, maxQuestions);
  };

  const updateCardProgress = (cardId, wasCorrect) => {
    const currentProgress = cardProgress[cardId] || {
      difficulty: 1,
      lastReviewed: new Date(),
      reviewCount: 0,
      correctCount: 0,
      nextReview: new Date()
    };

    const newProgress = {
      ...currentProgress,
      reviewCount: currentProgress.reviewCount + 1,
      correctCount: wasCorrect ? currentProgress.correctCount + 1 : currentProgress.correctCount,
      lastReviewed: new Date(),
    };

    // Spaced Repetition Algorithmus
    if (wasCorrect) {
      newProgress.difficulty = Math.min(newProgress.difficulty + 1, 5);
      const daysToAdd = Math.pow(2, newProgress.difficulty - 1);
      newProgress.nextReview = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      newProgress.difficulty = Math.max(newProgress.difficulty - 1, 1);
      newProgress.nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 Tag
    }

    setCardProgress(prev => ({
      ...prev,
      [cardId]: newProgress
    }));
  };

  const getCardsForReview = () => {
    const now = new Date();
    return flashcards.filter((card, index) => {
      const progress = cardProgress[`${currentSetId}_${index}`];
      if (!progress) return true; // Neue Karten immer zeigen
      return progress.nextReview <= now;
    });
  };

  // Kategorie-Management
  const addCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowCategoryInput(false);
    }
  };

  const deleteCategory = (categoryToDelete) => {
    if (categoryToDelete === 'Allgemein') return; // Standard-Kategorie nicht löschen
    setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('Allgemein');
    }
  };

  // Tag Management Functions
  const addTag = (tagName) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !globalTags.includes(trimmedTag)) {
      setGlobalTags(prev => [...prev, trimmedTag]);
      return true;
    }
    return false;
  };

  const extractTagsFromContent = (content) => {
    // Simple tag extraction - look for common academic topics
    const commonTopics = [
      'math', 'science', 'history', 'literature', 'biology', 'chemistry', 
      'physics', 'geography', 'psychology', 'philosophy', 'economics',
      'computer science', 'programming', 'languages', 'art', 'music'
    ];
    
    const contentLower = content.toLowerCase();
    const extractedTags = commonTopics.filter(topic => 
      contentLower.includes(topic)
    );
    
    return extractedTags;
  };

  // Manual Content Creation Functions
  const handleManualCardsCreated = (cards) => {
    setFlashcards(prev => [...prev, ...cards]);
    
    // Extract and add tags from new cards
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => addTag(tag));
      }
    });
    
    if (contentTypeSelection === 'flashcards') {
      // Only creating flashcards, save immediately
      const title = `Manuelle Karten ${new Date().toLocaleDateString()}`;
      saveCurrentSet(title, selectedCategory);
      setCurrentView('overview');
    } else if (contentTypeSelection === 'both') {
      // Creating both, move to quiz creation
      setCurrentView('manual-quiz-creation');
    } else {
      // This shouldn't happen when creating cards, but handle it
      setCurrentView('upload');
    }
  };

  const handleManualQuizCreated = (questions) => {
    setQuizQuestions(prev => [...prev, ...questions]);
    
    // Extract and add tags from new questions
    questions.forEach(question => {
      if (question.tags) {
        question.tags.forEach(tag => addTag(tag));
      }
    });
    
    const title = `Manueller Inhalt ${new Date().toLocaleDateString()}`;
    saveCurrentSet(title, selectedCategory);
    setCurrentView('overview');
  };

  // Karteikarten-Sets Management
  const saveCurrentSet = (title, category = selectedCategory) => {
    const setId = Date.now().toString();
    const newSet = {
      id: setId,
      title,
      category,
      flashcards: [...flashcards],
      quizQuestions: [...quizQuestions],
      created: new Date(),
      lastStudied: null,
      studyCount: 0
    };

    setCardSets(prev => ({
      ...prev,
      [setId]: newSet
    }));

    setCurrentSetId(setId);
    return setId;
  };

  const loadCardSet = (setId) => {
    const set = cardSets[setId];
    if (set) {
      setFlashcards(set.flashcards);
      setQuizQuestions(set.quizQuestions);
      setCurrentSetId(setId);
      setSelectedCategory(set.category);
      
      // Set als zuletzt studiert markieren
      setCardSets(prev => ({
        ...prev,
        [setId]: {
          ...prev[setId],
          lastStudied: new Date(),
          studyCount: prev[setId].studyCount + 1
        }
      }));
    }
  };

  const deleteCardSet = (setId) => {
    setCardSets(prev => {
      const newSets = { ...prev };
      delete newSets[setId];
      return newSets;
    });
    
    if (currentSetId === setId) {
      setCurrentSetId(null);
      setFlashcards([]);
      setQuizQuestions([]);
    }
  };

  // Export/Import Funktionen
  const exportCardSet = (setId) => {
    const set = cardSets[setId];
    if (set) {
      const exportData = {
        ...set,
        exportedAt: new Date(),
        version: "1.0"
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${set.title.replace(/\s+/g, '_')}_karteikarten.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  const exportAllSets = () => {
    const exportData = {
      cardSets,
      categories,
      statistics,
      exportedAt: new Date(),
      version: "1.0"
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `StudyMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importCardSets = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (importData.cardSets) {
            // Vollständiger Backup-Import
            setCardSets(prev => ({ ...prev, ...importData.cardSets }));
            if (importData.categories) {
              setCategories(prev => [...new Set([...prev, ...importData.categories])]);
            }
            if (importData.statistics) {
              setStatistics(importData.statistics);
            }
          } else if (importData.flashcards) {
            // Einzelnes Set importieren
            const setId = Date.now().toString();
            const newSet = {
              id: setId,
              title: importData.title || 'Importiertes Set',
              category: importData.category || 'Allgemein',
              flashcards: importData.flashcards,
              quizQuestions: importData.quizQuestions || [],
              created: new Date(),
              lastStudied: null,
              studyCount: 0
            };
            
            setCardSets(prev => ({
              ...prev,
              [setId]: newSet
            }));
          }
          
          alert('Import erfolgreich!');
        } catch (error) {
          alert('Fehler beim Importieren: Ungültiges Dateiformat');
        }
      };
      reader.readAsText(file);
    }
  };

  // Statistiken aktualisieren
  const updateStatistics = (quizCompleted = false, score = 0, totalQuestions = 0) => {
    setStatistics(prev => ({
      totalStudySessions: prev.totalStudySessions + 1,
      totalCardsStudied: prev.totalCardsStudied + (quizCompleted ? 0 : 1),
      totalQuizzesTaken: prev.totalQuizzesTaken + (quizCompleted ? 1 : 0),
      totalQuizQuestions: prev.totalQuizQuestions + (quizCompleted ? totalQuestions : 0),
      averageScore: quizCompleted 
        ? prev.totalQuizzesTaken > 0
          ? (prev.averageScore * prev.totalQuizzesTaken + (score / totalQuestions * 100)) / (prev.totalQuizzesTaken + 1)
          : (score / totalQuestions * 100)
        : prev.averageScore,
      studyStreak: prev.studyStreak + 1 // Vereinfacht - könnte basierend auf Datum berechnet werden
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      let content = '';
      if (file.type === "application/pdf") {
        content = await extractTextFromPDF(file);
      } else {
        content = await file.text();
      }
      setUploadedContent(content);

      if (creationMode === 'auto') {
        // KI-API-Call:
        try {
          const { flashcards, quiz } = await generateContentWithAI(content);
          const autoTags = extractTagsFromContent(content);
          
          // Enhance flashcards with metadata
          const enhancedFlashcards = flashcards.map(card => ({
            ...card,
            tags: autoTags,
            createdBy: 'ai',
            difficulty: 1
          }));

          // Enhance quiz questions with metadata  
          const enhancedQuiz = quiz.map(question => ({
            ...question,
            tags: autoTags,
            createdBy: 'ai',
            difficulty: 1
          }));

          // Update global tags
          autoTags.forEach(tag => addTag(tag));

          // Set content based on selection
          if (contentTypeSelection === 'both' || contentTypeSelection === 'flashcards') {
            setFlashcards(enhancedFlashcards);
          } else {
            setFlashcards([]);
          }

          if (contentTypeSelection === 'both' || contentTypeSelection === 'quiz') {
            setQuizQuestions(enhancedQuiz);
          } else {
            setQuizQuestions([]);
          }

          const title = `Lernset ${new Date().toLocaleDateString()}`;
          saveCurrentSet(title, selectedCategory);
          setCurrentView('overview');
        } catch (err) {
          alert('Fehler bei der KI-Auswertung! ' + (err.message || err));
        }
      } else {
        // Manual mode - navigate to manual creation interface
        setCurrentView('manual-creation');
      }
    }
  };

  const handleTextUpload = async () => {
    if (uploadedContent.trim()) {
      try {
        if (creationMode === 'auto') {
          // AI-generated content
          const { flashcards, quiz } = await generateContentWithAI(uploadedContent);
          const autoTags = extractTagsFromContent(uploadedContent);
          
          // Enhance flashcards with metadata
          const enhancedFlashcards = flashcards.map(card => ({
            ...card,
            tags: autoTags,
            createdBy: 'ai',
            difficulty: 1
          }));

          // Enhance quiz questions with metadata  
          const enhancedQuiz = quiz.map(question => ({
            ...question,
            tags: autoTags,
            createdBy: 'ai',
            difficulty: 1
          }));

          // Update global tags
          autoTags.forEach(tag => addTag(tag));

          // Set content based on selection
          if (contentTypeSelection === 'both' || contentTypeSelection === 'flashcards') {
            setFlashcards(enhancedFlashcards);
          } else {
            setFlashcards([]);
          }

          if (contentTypeSelection === 'both' || contentTypeSelection === 'quiz') {
            setQuizQuestions(enhancedQuiz);
          } else {
            setQuizQuestions([]);
          }
        } else {
          // Manual mode - navigate to manual creation interface
          setCurrentView('manual-creation');
          return;
        }
        
        const title = `Lernset ${new Date().toLocaleDateString()}`;
        saveCurrentSet(title, selectedCategory);
        setCurrentView('overview');
      } catch (err) {
        alert('Fehler bei der KI-Auswertung! ' + (err.message || err));
      }
    }
  };

  const nextCard = () => {
    // Fortschritt für Spaced Repetition aktualisieren
    const cardId = `${currentSetId}_${currentCardIndex}`;
    updateCardProgress(cardId, true); // Angenommen: nächste Karte = verstanden
    updateStatistics();
    
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const markCardDifficult = () => {
    const cardId = `${currentSetId}_${currentCardIndex}`;
    updateCardProgress(cardId, false); // Als schwierig markieren
    nextCard();
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleQuizAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const startAdaptiveQuiz = (mode = 'adaptive') => {
    setQuizMode(mode);
    const adaptiveQuestions = getQuestionsForQuiz(mode);
    
    if (adaptiveQuestions.length === 0) {
      alert('Keine Fragen für diesen Modus verfügbar. Starte mit zufälligem Quiz.');
      setQuizMode('random');
      return;
    }
    
    // Temporär die gefilterten Fragen setzen
    setQuizQuestions(adaptiveQuestions);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizAnswers([]);
    setSelectedAnswer('');
    setCurrentView('quiz');
  };

  const submitQuizAnswer = () => {
    const currentQuestion = quizQuestions[currentQuizIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct;
    const questionId = currentQuestion.id || `${currentSetId}_quiz_${currentQuestion.originalIndex || currentQuizIndex}`;
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    
    // Quiz-Progress aktualisieren
    updateQuestionProgress(questionId, isCorrect);
    
    setQuizAnswers(prev => [...prev, {
      questionIndex: currentQuizIndex,
      questionId,
      selected: selectedAnswer,
      correct: currentQuestion.correct,
      isCorrect,
      difficulty: getQuestionDifficulty(questionId)
    }]);

    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      // Quiz abgeschlossen - Statistiken aktualisieren und Ergebnisse speichern
      const finalScore = quizScore + (isCorrect ? 1 : 0);
      updateStatistics(true, finalScore, quizQuestions.length);
      
      // Quiz-Historie speichern
      const quizResult = {
        id: Date.now(),
        setId: currentSetId,
        setTitle: cardSets[currentSetId]?.title || 'Unbekanntes Set',
        mode: quizMode,
        score: finalScore,
        totalQuestions: quizQuestions.length,
        percentage: Math.round((finalScore / quizQuestions.length) * 100),
        date: new Date(),
        answers: [...quizAnswers, {
          questionIndex: currentQuizIndex,
          questionId,
          selected: selectedAnswer,
          correct: currentQuestion.correct,
          isCorrect,
          difficulty: getQuestionDifficulty(questionId)
        }]
      };
      
      setQuizHistory(prev => [quizResult, ...prev].slice(0, 50)); // Behalte nur die letzten 50 Quiz-Ergebnisse
      setCurrentView('quiz-results');
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizAnswers([]);
    setSelectedAnswer('');
    setCurrentView('quiz');
  };

  const renderUploadView = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">StudyMaster</h1>
          <p className="text-gray-600">Verwandle deine Lernmaterialien in interaktive Karteikarten und Quizze</p>
        </div>

        <div className="space-y-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie auswählen:</label>
            <div className="flex gap-2 items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
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

          {/* Creation Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Erstellungsmodus:</label>
            <div className="flex gap-4">
              <button
                onClick={() => setCreationMode('auto')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  creationMode === 'auto' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
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
                  creationMode === 'manual' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Edit className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Manuell</div>
                  <div className="text-sm text-gray-600">Selbst erstellen</div>
                </div>
              </button>
            </div>
          </div>

          {/* Content Type Selection */}
          <ContentTypeSelector
            selectedType={contentTypeSelection}
            onTypeChange={setContentTypeSelection}
            className="mb-4"
          />

          {/* File Upload or Manual Creation */}
          {creationMode === 'auto' && (
            <>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">Datei hochladen (Text oder PDF)</p>
                <input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="text-gray-500">oder</div>

              <div className="space-y-4">
                <textarea
                  value={uploadedContent}
                  onChange={(e) => setUploadedContent(e.target.value)}
                  className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Füge hier deinen Text ein..."
                />
                <button
                  onClick={handleTextUpload}
                  disabled={!uploadedContent.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Mit KI erstellen
                </button>
              </div>
            </>
          )}

          {creationMode === 'manual' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-xl p-6 text-center">
                <Edit className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Manueller Modus</h3>
                <p className="text-gray-600 mb-4">Erstellen Sie Ihre eigenen Lernkarten und Quizfragen</p>
                <button
                  onClick={() => setCurrentView('manual-creation')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  Manuell erstellen
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={importCardSets}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadIcon className="w-4 h-4" />
                Sets importieren
              </label>
            </div>
            <button
              onClick={exportAllSets}
              disabled={Object.keys(cardSets).length === 0}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Alle exportieren
            </button>
          </div>
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Statistiken
            </button>
            <button
              onClick={() => setCurrentView('library')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Bibliothek
            </button>
          </div>
        </div>
        
        {currentSetId && (
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div 
              onClick={() => setCurrentView('flashcards')}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-10 h-10" />
                <span className="text-2xl font-bold">{getCardsForReview().length}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zu wiederholende Karten</h3>
              <p className="text-green-100">Basierend auf Spaced Repetition</p>
            </div>

            <div 
              onClick={() => setCurrentView('quiz-selection')}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <Brain className="w-10 h-10" />
                <span className="text-2xl font-bold">{getQuestionsForQuiz('adaptive').length}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Intelligentes Quiz</h3>
              <p className="text-orange-100">Adaptive Fragen bereit</p>
            </div>

            <div 
              onClick={() => setCurrentView('statistics')}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-10 h-10" />
                <span className="text-2xl font-bold">{statistics.studyStreak}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lernstreak</h3>
              <p className="text-blue-100">Tage in Folge gelernt</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Schnellzugriff</h3>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('upload')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neues Lernset erstellen
              </button>
              {currentSetId && (
                <button
                  onClick={() => exportCardSet(currentSetId)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Aktuelles Set exportieren
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Zuletzt studiert</h3>
            <div className="space-y-2">
              {Object.values(cardSets)
                .filter(set => set.lastStudied)
                .sort((a, b) => new Date(b.lastStudied) - new Date(a.lastStudied))
                .slice(0, 3)
                .map(set => (
                  <div key={set.id} className="flex justify-between items-center">
                    <span className="text-gray-700 truncate">{set.title}</span>
                    <button
                      onClick={() => {
                        loadCardSet(set.id);
                        setCurrentView('flashcards');
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Weiter lernen
                    </button>
                  </div>
                ))}
              {Object.values(cardSets).filter(set => set.lastStudied).length === 0 && (
                <p className="text-gray-500">Noch keine Sets studiert</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFlashcards = () => (
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
                <p className="text-lg text-gray-700">{flashcards[currentCardIndex]?.question}</p>
                <p className="text-sm text-gray-500 mt-4">Klicke zum Umdrehen</p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-4">Antwort:</h3>
                <p className="text-lg text-gray-700">{flashcards[currentCardIndex]?.answer}</p>
              </div>
            )}
          </div>
        </div>

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
                  onClick={markCardDifficult}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Schwer
                </button>
                <button
                  onClick={nextCard}
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
            onClick={() => setCurrentView('overview')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentQuestion = quizQuestions[currentQuizIndex];
    const questionId = currentQuestion?.id || `${currentSetId}_quiz_${currentQuestion?.originalIndex || currentQuizIndex}`;
    const difficulty = getQuestionDifficulty(questionId);
    const progress = quizProgress[questionId];
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quiz</h2>
              <p className="text-sm text-gray-600">Modus: {
                quizMode === 'adaptive' ? 'Intelligent' :
                quizMode === 'difficult' ? 'Schwierige Fragen' : 'Zufällig'
              }</p>
            </div>
            <div className="text-right">
              <span className="text-gray-600">Frage {currentQuizIndex + 1} / {quizQuestions.length}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Schwierigkeit:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= difficulty ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {currentQuestion?.question}
            </h3>

            {progress && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Bereits {progress.answerCount}x beantwortet</span>
                  <span>{Math.round((progress.correctCount / progress.answerCount) * 100)}% richtig</span>
                </div>
                {progress.incorrectStreak > 0 && (
                  <div className="text-red-600 mt-1">
                    {progress.incorrectStreak} falsche Antworten in Folge
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuizAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-gray-700">{String.fromCharCode(65 + index)})</span>
                  <span className="ml-2 text-gray-700">{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentView('quiz-selection')}
              className="text-gray-600 hover:text-gray-700 font-medium"
            >
              Zurück zur Quiz-Auswahl
            </button>

            <button
              onClick={submitQuizAnswer}
              disabled={selectedAnswer === ''}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-6 rounded-lg font-semibold flex items-center gap-2"
            >
              {currentQuizIndex < quizQuestions.length - 1 ? 'Nächste Frage' : 'Quiz beenden'}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Quiz-Modus wählen</h2>
          <button
            onClick={() => setCurrentView('overview')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => startAdaptiveQuiz('adaptive')}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-10 h-10" />
              <span className="text-2xl font-bold">{getQuestionsForQuiz('adaptive').length}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Intelligentes Quiz</h3>
            <p className="text-purple-100 text-sm">
              Fokussiert auf schwierige Fragen und Wiederholungen. Passt sich deinem Lernfortschritt an.
            </p>
          </div>

          <div 
            onClick={() => startAdaptiveQuiz('difficult')}
            className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <X className="w-10 h-10" />
              <span className="text-2xl font-bold">{getQuestionsForQuiz('difficult').length}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Schwierige Fragen</h3>
            <p className="text-red-100 text-sm">
              Nur Fragen, die du oft falsch beantwortet hast. Ideal für gezieltes Üben.
            </p>
          </div>

          <div 
            onClick={() => startAdaptiveQuiz('random')}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <RotateCcw className="w-10 h-10" />
              <span className="text-2xl font-bold">{quizQuestions.length}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Zufälliges Quiz</h3>
            <p className="text-blue-100 text-sm">
              Alle Fragen in zufälliger Reihenfolge. Perfekt für Gesamtwiederholungen.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Deine Quiz-Performance</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{statistics.totalQuizzesTaken}</div>
              <div className="text-sm text-gray-600">Quizze absolviert</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{Math.round(statistics.averageScore)}%</div>
              <div className="text-sm text-gray-600">Durchschnitts-Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{statistics.totalQuizQuestions}</div>
              <div className="text-sm text-gray-600">Fragen beantwortet</div>
            </div>
          </div>

          {quizHistory.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-3">Letzte Quiz-Ergebnisse:</h4>
              <div className="space-y-2">
                {quizHistory.slice(0, 5).map(quiz => (
                  <div key={quiz.id} className="flex justify-between items-center bg-white rounded-lg p-3">
                    <div>
                      <span className="font-medium text-gray-700">{quiz.setTitle}</span>
                      <span className="text-sm text-gray-500 ml-2">({quiz.mode})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {new Date(quiz.date).toLocaleDateString()}
                      </span>
                      <span className={`font-medium ${
                        quiz.percentage >= 80 ? 'text-green-600' :
                        quiz.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {quiz.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lernset-Bibliothek</h2>
          <button
            onClick={() => setCurrentView('overview')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => {
              const setsInCategory = Object.values(cardSets).filter(set => set.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(category);
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(cardSets)
            .filter(set => selectedCategory === 'Allgemein' || set.category === selectedCategory)
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .map(set => (
              <div key={set.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{set.title}</h3>
                    <p className="text-sm text-gray-600">{set.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => exportCardSet(set.id)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Exportieren"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCardSet(set.id)}
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
                    <span>{set.flashcards.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Quiz-Fragen:</span>
                    <span>{set.quizQuestions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Studiert:</span>
                    <span>{set.studyCount} mal</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Erstellt:</span>
                    <span>{new Date(set.created).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      loadCardSet(set.id);
                      setCurrentView('flashcards');
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    Lernen
                  </button>
                  <button
                    onClick={() => {
                      loadCardSet(set.id);
                      setCurrentView('quiz');
                    }}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 text-sm flex items-center justify-center gap-1"
                  >
                    <Brain className="w-4 h-4" />
                    Quiz
                  </button>
                </div>
              </div>
            ))}
        </div>

        {Object.values(cardSets).filter(set => selectedCategory === 'Allgemein' || set.category === selectedCategory).length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Keine Lernsets in dieser Kategorie</p>
            <button
              onClick={() => setCurrentView('upload')}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Erstes Lernset erstellen
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lernstatistiken</h2>
          <button
            onClick={() => setCurrentView('overview')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <Calendar className="w-8 h-8 mb-3" />
            <div className="text-3xl font-bold mb-1">{statistics.studyStreak}</div>
            <div className="text-blue-100">Tage Lernstreak</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <BookOpen className="w-8 h-8 mb-3" />
            <div className="text-3xl font-bold mb-1">{statistics.totalCardsStudied}</div>
            <div className="text-green-100">Karten studiert</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <Brain className="w-8 h-8 mb-3" />
            <div className="text-3xl font-bold mb-1">{statistics.totalQuizzesTaken}</div>
            <div className="text-purple-100">Quizze absolviert</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <Award className="w-8 h-8 mb-3" />
            <div className="text-3xl font-bold mb-1">{Math.round(statistics.averageScore)}%</div>
            <div className="text-orange-100">Durchschn. Quiz-Score</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz-Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Gesamte Fragen:</span>
                <span className="font-medium">{statistics.totalQuizQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Erfolgsquote:</span>
                <span className="font-medium text-green-600">
                  {Math.round(statistics.averageScore)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Schwierige Fragen:</span>
                <span className="font-medium text-red-600">
                  {Object.values(quizProgress).filter(p => p.difficulty < 2).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Gemeisterte Fragen:</span>
                <span className="font-medium text-green-600">
                  {Object.values(quizProgress).filter(p => p.difficulty >= 4).length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Kategorien-Übersicht</h3>
            <div className="space-y-3">
              {categories.map(category => {
                const setsInCategory = Object.values(cardSets).filter(set => set.category === category);
                const totalCards = setsInCategory.reduce((sum, set) => sum + set.flashcards.length, 0);
                const totalStudied = setsInCategory.reduce((sum, set) => sum + set.studyCount, 0);
                
                return (
                  <div key={category} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-700">{category}</div>
                      <div className="text-sm text-gray-500">{setsInCategory.length} Sets, {totalCards} Karten</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-700">{totalStudied}</div>
                      <div className="text-sm text-gray-500">mal studiert</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Letzte Quiz-Ergebnisse</h3>
            <div className="space-y-3">
              {quizHistory.slice(0, 5).map(quiz => (
                <div key={quiz.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700 truncate">{quiz.setTitle}</div>
                    <div className="text-sm text-gray-500">
                      {quiz.mode} • {new Date(quiz.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      quiz.percentage >= 80 ? 'text-green-600' :
                      quiz.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {quiz.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">{quiz.score}/{quiz.totalQuestions}</div>
                  </div>
                </div>
              ))}
              {quizHistory.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Noch keine Quizze absolviert
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuizResults = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz abgeschlossen!</h2>
        
        <div className="text-6xl font-bold text-green-600 mb-2">
          {Math.round((quizScore / quizQuestions.length) * 100)}%
        </div>
        
        <p className="text-xl text-gray-600 mb-8">
          {quizScore} von {quizQuestions.length} Fragen richtig
        </p>

        <div className="space-y-4 mb-8">
          {quizAnswers.map((answer, index) => (
            <div key={index} className={`p-4 rounded-lg ${answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">
                  Frage {answer.questionIndex + 1}
                </span>
                {answer.isCorrect ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={resetQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold"
          >
            Quiz wiederholen
          </button>
          
          <button
            onClick={() => setCurrentView('overview')}
            className="w-full text-blue-600 hover:text-blue-700 py-3 px-6 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>
  );

  // Manual Creation Views
  const renderManualCreation = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Was möchten Sie erstellen?</h2>
        <p className="text-gray-600 mb-6">Wählen Sie aus, welchen Inhaltstyp Sie manuell erstellen möchten.</p>
        
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
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Karteikarten erstellen</h3>
            <p className="text-blue-100">Erstellen Sie individuelle Lernkarten</p>
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
            className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Quiz erstellen</h3>
            <p className="text-green-100">Erstellen Sie Multiple-Choice-Fragen</p>
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

  const renderManualCardCreation = () => (
    <ManualCardCreator
      onCardsCreated={handleManualCardsCreated}
      onCancel={() => setCurrentView('manual-creation')}
      availableTags={globalTags}
      onTagAdded={addTag}
      existingCards={flashcards}
    />
  );

  const renderManualQuizCreation = () => (
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
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 py-8 px-4">
      {currentView === 'upload' && renderUploadView()}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'library' && renderLibrary()}
      {currentView === 'statistics' && renderStatistics()}
      {currentView === 'flashcards' && renderFlashcards()}
      {currentView === 'quiz-selection' && renderQuizSelection()}
      {currentView === 'quiz' && renderQuiz()}
      {currentView === 'quiz-results' && renderQuizResults()}
      {currentView === 'manual-creation' && renderManualCreation()}
      {currentView === 'manual-card-creation' && renderManualCardCreation()}
      {currentView === 'manual-quiz-creation' && renderManualQuizCreation()}
    </div>
  );
};

export default StudyApp;