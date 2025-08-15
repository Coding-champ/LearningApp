import { useState, useCallback } from 'react';

const useQuizLogic = () => {
  const [quizProgress, setQuizProgress] = useState({});
  const [quizMode, setQuizMode] = useState('adaptive'); // 'adaptive', 'random', 'difficult'

  const getQuestionDifficulty = useCallback((questionId) => {
    return quizProgress[questionId]?.difficulty || 1;
  }, [quizProgress]);

  const updateQuestionProgress = useCallback((questionId, wasCorrect, timeTaken = 0) => {
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
  }, [quizProgress]);

  const getQuestionsForQuiz = useCallback((quizQuestions, currentSetId, mode = quizMode, maxQuestions = 10) => {
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
  }, [quizProgress, quizMode]);

  return {
    quizProgress,
    setQuizProgress,
    quizMode,
    setQuizMode,
    getQuestionDifficulty,
    updateQuestionProgress,
    getQuestionsForQuiz
  };
};

export default useQuizLogic;