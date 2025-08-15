import React from 'react';
import { Calendar, BookOpen, Brain, Award } from 'lucide-react';

const StatisticsView = ({ 
  statistics,
  quizProgress,
  categories,
  cardSets,
  quizHistory,
  onBackToOverview 
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lernstatistiken</h2>
          <button
            onClick={onBackToOverview}
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
                  {quizProgress ? Object.values(quizProgress).filter(p => p.difficulty < 2).length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Gemeisterte Fragen:</span>
                <span className="font-medium text-green-600">
                  {quizProgress ? Object.values(quizProgress).filter(p => p.difficulty >= 4).length : 0}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Kategorien-Übersicht</h3>
            <div className="space-y-3">
              {categories && categories.map(category => {
                const setsInCategory = cardSets ? Object.values(cardSets).filter(set => set.category === category) : [];
                const totalCards = setsInCategory.reduce((sum, set) => sum + (set.flashcards ? set.flashcards.length : 0), 0);
                const totalStudied = setsInCategory.reduce((sum, set) => sum + (set.studyCount || 0), 0);
                
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
              {quizHistory && quizHistory.slice(0, 5).map((quiz, index) => (
                <div key={quiz.id || index} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700 truncate">{quiz.setTitle || 'Quiz'}</div>
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
              {(!quizHistory || quizHistory.length === 0) && (
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
};

export default React.memo(StatisticsView);