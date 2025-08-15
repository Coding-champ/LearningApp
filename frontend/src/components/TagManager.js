import React, { useState } from 'react';
import { Tag, Plus, X, Edit3, Save } from 'lucide-react';

const TagManager = ({ 
  tags = [], 
  onTagAdded, 
  onTagRemoved, 
  onTagRenamed,
  className = ""
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAddTag = () => {
    const trimmedTag = newTagName.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagAdded(trimmedTag);
      setNewTagName('');
    }
  };

  const handleStartEdit = (tag) => {
    setEditingTag(tag);
    setEditValue(tag);
  };

  const handleSaveEdit = () => {
    const trimmedNewName = editValue.trim().toLowerCase();
    if (trimmedNewName && trimmedNewName !== editingTag && !tags.includes(trimmedNewName)) {
      onTagRenamed(editingTag, trimmedNewName);
    }
    setEditingTag(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (editingTag) {
        handleSaveEdit();
      } else {
        handleAddTag();
      }
    }
    if (e.key === 'Escape') {
      if (editingTag) {
        handleCancelEdit();
      } else {
        setNewTagName('');
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5" />
        Tag-Verwaltung
      </h3>

      {/* Add New Tag */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Neuer Tag..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleAddTag}
          disabled={!newTagName.trim() || tags.includes(newTagName.trim().toLowerCase())}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>

      {/* Tags List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tags.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Noch keine Tags erstellt
          </div>
        ) : (
          tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              {editingTag === tag ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 p-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(tag)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Tag bearbeiten"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onTagRemoved(tag)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Tag löschen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          {tags.length} Tag{tags.length !== 1 ? 's' : ''} insgesamt
        </div>
      )}
    </div>
  );
};

export default TagManager;