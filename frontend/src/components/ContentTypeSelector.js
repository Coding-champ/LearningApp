import React from 'react';
import { BookOpen, Brain, Layers } from 'lucide-react';

const ContentTypeSelector = ({ 
  selectedType, 
  onTypeChange, 
  disabled = false,
  className = "" 
}) => {
  const options = [
    {
      value: 'both',
      label: 'Beide',
      description: 'Karteikarten & Quiz',
      icon: Layers,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      value: 'flashcards',
      label: 'Karteikarten',
      description: 'Nur Flashcards',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600'
    },
    {
      value: 'quiz',
      label: 'Quiz',
      description: 'Nur Quizfragen',
      icon: Brain,
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Inhaltstyp auswählen:
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              disabled={disabled}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    bg-gradient-to-br ${option.color} text-white
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{option.label}</div>
                  <div className="text-xs text-gray-600">{option.description}</div>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContentTypeSelector;