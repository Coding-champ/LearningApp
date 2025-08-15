import { useState, useCallback } from 'react';

const useSpacedRepetition = () => {
  const [cardProgress, setCardProgress] = useState({});

  const updateCardProgress = useCallback((cardId, wasCorrect) => {
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

    // Spaced Repetition Algorithm
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
  }, [cardProgress]);

  const getCardsForReview = useCallback((flashcards, currentSetId) => {
    const now = new Date();
    return flashcards.filter((card, index) => {
      const progress = cardProgress[`${currentSetId}_${index}`];
      if (!progress) return true; // Neue Karten immer zeigen
      return progress.nextReview <= now;
    });
  }, [cardProgress]);

  return {
    cardProgress,
    setCardProgress,
    updateCardProgress,
    getCardsForReview
  };
};

export default useSpacedRepetition;