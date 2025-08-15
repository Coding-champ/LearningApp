import { useState, useCallback } from 'react';

const useStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalStudySessions: 0,
    totalCardsStudied: 0,
    totalQuizzesTaken: 0,
    totalQuizQuestions: 0,
    averageScore: 0,
    studyStreak: 0
  });
  const [quizHistory, setQuizHistory] = useState([]);

  const updateStatistics = useCallback((updates) => {
    setStatistics(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const addQuizResult = useCallback((result) => {
    setQuizHistory(prev => [...prev, {
      ...result,
      date: new Date(),
      id: Date.now().toString()
    }]);

    // Update statistics
    setStatistics(prev => {
      const newTotalQuizzes = prev.totalQuizzesTaken + 1;
      const newTotalQuestions = prev.totalQuizQuestions + result.totalQuestions;
      const newAverageScore = (prev.averageScore * prev.totalQuizzesTaken + result.score) / newTotalQuizzes;

      return {
        ...prev,
        totalQuizzesTaken: newTotalQuizzes,
        totalQuizQuestions: newTotalQuestions,
        averageScore: Math.round(newAverageScore * 100) / 100
      };
    });
  }, []);

  const addStudySession = useCallback((cardsStudied = 1) => {
    setStatistics(prev => ({
      ...prev,
      totalStudySessions: prev.totalStudySessions + 1,
      totalCardsStudied: prev.totalCardsStudied + cardsStudied
    }));
  }, []);

  const calculateStreakData = useCallback(() => {
    // Calculate study streak based on quiz history
    const today = new Date();
    const recentHistory = quizHistory
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const daysDiff = (today - entryDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Last 30 days
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of recentHistory) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [quizHistory]);

  return {
    statistics,
    setStatistics,
    quizHistory,
    setQuizHistory,
    updateStatistics,
    addQuizResult,
    addStudySession,
    calculateStreakData
  };
};

export default useStatistics;