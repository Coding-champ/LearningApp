import React, { useState, useCallback } from 'react';
import { Brain, X, RotateCcw, Check, Tag, Calendar, Award } from 'lucide-react';

const QuizModeSelection = ({ 
  onModeSelect, 
  getQuestionsForQuiz,
  quizQuestions,
  statistics,
  quizHistory,
  onBackToOverview 
}) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quiz-Modus wählen</h2>
        <button
          onClick={onBackToOverview}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Zurück zur Übersicht
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => onModeSelect('adaptive')}
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
          onClick={() => onModeSelect('difficult')}
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
          onClick={() => onModeSelect('random')}
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

        {quizHistory && quizHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-3">Letzte Quiz-Ergebnisse:</h4>
            <div className="space-y-2">
              {quizHistory.slice(0, 5).map((quiz, index) => (
                <div key={quiz.id || index} className="flex justify-between items-center bg-white rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-700">{quiz.setTitle || 'Quiz'}</span>
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

const QuizQuestion = ({ 
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  onBackToSelection,
  mode,
  difficulty,
  progress
}) => {
  const modeNames = {
    adaptive: 'Intelligent',
    difficult: 'Schwierige Fragen',
    random: 'Zufällig'
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quiz</h2>
            <p className="text-sm text-gray-600">Modus: {modeNames[mode] || mode}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-600">Frage {questionIndex + 1} / {totalQuestions}</span>
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
            {question?.question}
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
            {question?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswerSelect(index)}
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

          {/* Enhanced Metadata Display */}
          {question && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {question.tags && question.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <div className="flex gap-1 flex-wrap">
                      {question.tags.map((tag, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {question.createdAt ? 
                        new Date(question.createdAt).toLocaleDateString() : 
                        'Unbekannt'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      question.createdBy === 'ai' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {question.createdBy === 'ai' ? 'KI-erstellt' : 'Manuell'}
                    </span>
                  </div>

                  {question.category && (
                    <div className="flex items-center gap-1">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        {question.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onBackToSelection}
            className="text-gray-600 hover:text-gray-700 font-medium"
          >
            Zurück zur Quiz-Auswahl
          </button>

          <button
            onClick={onSubmit}
            disabled={selectedAnswer === '' || selectedAnswer === null || selectedAnswer === undefined}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-6 rounded-lg font-semibold flex items-center gap-2"
          >
            {questionIndex < totalQuestions - 1 ? 'Nächste Frage' : 'Quiz beenden'}
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizResults = ({ 
  score,
  totalQuestions,
  answers,
  onResetQuiz,
  onBackToOverview
}) => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Award className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz abgeschlossen!</h2>
      
      <div className="text-6xl font-bold text-green-600 mb-2">
        {Math.round((score / totalQuestions) * 100)}%
      </div>
      
      <p className="text-xl text-gray-600 mb-8">
        {score} von {totalQuestions} Fragen richtig
      </p>

      <div className="space-y-4 mb-8">
        {answers && answers.map((answer, index) => (
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
          onClick={onResetQuiz}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold"
        >
          Quiz wiederholen
        </button>
        
        <button
          onClick={onBackToOverview}
          className="w-full text-blue-600 hover:text-blue-700 py-3 px-6 font-medium"
        >
          Zurück zur Übersicht
        </button>
      </div>
    </div>
  </div>
);

const QuizView = ({ 
  view,
  quizQuestions,
  currentQuizIndex,
  selectedAnswer,
  quizScore,
  quizAnswers,
  quizMode,
  getQuestionsForQuiz,
  getQuestionDifficulty,
  quizProgress,
  statistics,
  quizHistory,
  onModeSelect,
  onAnswerSelect,
  onSubmitAnswer,
  onResetQuiz,
  onBackToOverview,
  onBackToSelection
}) => {
  switch (view) {
    case 'quiz-selection':
      return (
        <QuizModeSelection
          onModeSelect={onModeSelect}
          getQuestionsForQuiz={getQuestionsForQuiz}
          quizQuestions={quizQuestions}
          statistics={statistics}
          quizHistory={quizHistory}
          onBackToOverview={onBackToOverview}
        />
      );

    case 'quiz':
      const currentQuestion = quizQuestions[currentQuizIndex];
      const questionId = currentQuestion?.id || `quiz_${currentQuizIndex}`;
      const difficulty = getQuestionDifficulty(questionId);
      const progress = quizProgress[questionId];

      return (
        <QuizQuestion
          question={currentQuestion}
          questionIndex={currentQuizIndex}
          totalQuestions={quizQuestions.length}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
          onSubmit={onSubmitAnswer}
          onBackToSelection={onBackToSelection}
          mode={quizMode}
          difficulty={difficulty}
          progress={progress}
        />
      );

    case 'quiz-results':
      return (
        <QuizResults
          score={quizScore}
          totalQuestions={quizQuestions.length}
          answers={quizAnswers}
          onResetQuiz={onResetQuiz}
          onBackToOverview={onBackToOverview}
        />
      );

    default:
      return null;
  }
};

export default React.memo(QuizView);