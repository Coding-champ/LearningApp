import React, { useState, useRef, useEffect } from 'react';
import { Tag, X, Plus } from 'lucide-react';

const TagInput = ({ 
  selectedTags = [], 
  onTagsChange, 
  availableTags = [], 
  placeholder = "Tag hinzufügen...",
  className = "" 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const filteredSuggestions = availableTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const addTag = (tagName) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[0]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInputValue('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag, index) => (
          <div
            key={index}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            placeholder={placeholder}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {inputValue.trim() && (
            <button
              onClick={() => addTag(inputValue)}
              className="ml-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.map((tag, index) => (
              <button
                key={index}
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Tag className="w-3 h-3 text-gray-400" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;