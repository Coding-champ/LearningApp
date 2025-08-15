import { useState, useCallback } from 'react';

const useCardSets = () => {
  const [cardSets, setCardSets] = useState({});
  const [currentSetId, setCurrentSetId] = useState(null);
  const [categories, setCategories] = useState(['Allgemein']);
  const [selectedCategory, setSelectedCategory] = useState('Allgemein');

  const saveCurrentSet = useCallback((title, flashcards, quizQuestions, category = selectedCategory) => {
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
  }, [selectedCategory]);

  const loadCardSet = useCallback((setId) => {
    const set = cardSets[setId];
    if (set) {
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

      return set;
    }
    return null;
  }, [cardSets]);

  const deleteCardSet = useCallback((setId) => {
    setCardSets(prev => {
      const newSets = { ...prev };
      delete newSets[setId];
      return newSets;
    });
    
    if (currentSetId === setId) {
      setCurrentSetId(null);
    }
  }, [currentSetId]);

  const exportCardSet = useCallback((setId) => {
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
  }, [cardSets]);

  const exportAllSets = useCallback((statistics) => {
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
  }, [cardSets, categories]);

  const importCardSets = useCallback((event, onStatisticsUpdate, onCategoriesUpdate) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (importData.cardSets) {
            // Vollständiger Backup-Import
            setCardSets(prev => ({ ...prev, ...importData.cardSets }));
            if (importData.categories && onCategoriesUpdate) {
              onCategoriesUpdate(importData.categories);
            }
            if (importData.statistics && onStatisticsUpdate) {
              onStatisticsUpdate(importData.statistics);
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
  }, []);

  // Category Management
  const addCategory = useCallback((newCategoryName) => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      return true;
    }
    return false;
  }, [categories]);

  const deleteCategory = useCallback((categoryToDelete) => {
    if (categoryToDelete === 'Allgemein') return false; // Standard-Kategorie nicht löschen
    setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('Allgemein');
    }
    return true;
  }, [selectedCategory]);

  return {
    cardSets,
    setCardSets,
    currentSetId,
    setCurrentSetId,
    categories,
    setCategories,
    selectedCategory,
    setSelectedCategory,
    saveCurrentSet,
    loadCardSet,
    deleteCardSet,
    exportCardSet,
    exportAllSets,
    importCardSets,
    addCategory,
    deleteCategory
  };
};

export default useCardSets;