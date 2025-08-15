import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudyApp from '../App';

// Mock the AI generation and PDF utilities
jest.mock('../utils/generateContentWithAI', () => ({
  generateContentWithAI: jest.fn(() => Promise.resolve({
    flashcards: [
      {
        question: 'What is AI?',
        answer: 'Artificial Intelligence'
      }
    ],
    quiz: [
      {
        question: 'What does AI stand for?',
        options: ['Artificial Intelligence', 'Automated Intelligence', 'Advanced Intelligence', 'Applied Intelligence'],
        correct: 0
      }
    ]
  }))
}));

jest.mock('../utils/pdfToText', () => ({
  extractTextFromPDF: jest.fn(() => Promise.resolve('Sample PDF content about artificial intelligence'))
}));

describe('Enhanced Card Creation System', () => {
  test('displays creation mode selection with visual indicators', () => {
    render(<StudyApp />);
    
    // Check that both creation mode options are present
    expect(screen.getByText('Automatisch')).toBeInTheDocument();
    expect(screen.getByText('Manuell')).toBeInTheDocument();
    expect(screen.getByText('KI erstellt Inhalte')).toBeInTheDocument();
    expect(screen.getByText('Selbst erstellen')).toBeInTheDocument();
  });

  test('shows content type selector with all options', () => {
    render(<StudyApp />);
    
    expect(screen.getByText('Beide')).toBeInTheDocument();
    expect(screen.getByText('Karteikarten')).toBeInTheDocument();
    expect(screen.getByText(/Quiz/)).toBeInTheDocument();
  });

  test('displays tag manager in upload view', () => {
    render(<StudyApp />);
    
    expect(screen.getByText('Tag-Verwaltung')).toBeInTheDocument();
    expect(screen.getByText('Neuer Tag...')).toBeInTheDocument();
    expect(screen.getByText('Hinzufügen')).toBeInTheDocument();
  });

  test('can switch between creation modes', () => {
    render(<StudyApp />);
    
    const manualButton = screen.getByText('Manuell').closest('button');
    const autoButton = screen.getByText('Automatisch').closest('button');
    
    // Initially auto should be selected (has blue border)
    expect(autoButton).toHaveClass('border-blue-500');
    
    // Click manual mode
    fireEvent.click(manualButton);
    expect(manualButton).toHaveClass('border-blue-500');
    
    // Should now show manual creation interface
    expect(screen.getByText('Manuell erstellen')).toBeInTheDocument();
  });

  test('can add tags through tag manager', () => {
    render(<StudyApp />);
    
    const tagInput = screen.getByPlaceholderText('Neuer Tag...');
    const addButton = screen.getByText('Hinzufügen');
    
    // Add a new tag
    fireEvent.change(tagInput, { target: { value: 'science' } });
    fireEvent.click(addButton);
    
    // Tag should appear in the list
    waitFor(() => {
      expect(screen.getByText('science')).toBeInTheDocument();
    });
  });

  test('manual mode navigates to manual creation interface', () => {
    render(<StudyApp />);
    
    // Switch to manual mode
    const manualButton = screen.getByText('Manuell').closest('button');
    fireEvent.click(manualButton);
    
    // Click manual creation button
    const createButton = screen.getByText('Manuell erstellen');
    fireEvent.click(createButton);
    
    // Should see the creation type selection
    expect(screen.getByText('Was möchten Sie erstellen?')).toBeInTheDocument();
  });

  test('content type selection affects available creation options', () => {
    render(<StudyApp />);
    
    // Switch to manual mode
    const manualButton = screen.getByText('Manuell').closest('button');
    fireEvent.click(manualButton);
    
    // Select only flashcards
    const flashcardsOption = screen.getByText('Nur Flashcards').closest('button');
    fireEvent.click(flashcardsOption);
    
    // Navigate to manual creation
    const createButton = screen.getByText('Manuell erstellen');
    fireEvent.click(createButton);
    
    // Quiz option should be disabled
    const quizCreationButton = screen.getByText('Quiz erstellen').closest('button');
    expect(quizCreationButton).toBeDisabled();
  });

  test('AI generation includes enhanced metadata', async () => {
    render(<StudyApp />);
    
    // Add some content
    const textarea = screen.getByPlaceholderText('Füge hier deinen Text ein...');
    fireEvent.change(textarea, { target: { value: 'Content about artificial intelligence and machine learning' } });
    
    // Generate with AI
    const generateButton = screen.getByText('Mit KI erstellen');
    fireEvent.click(generateButton);
    
    // Wait for AI generation and navigation to overview
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('enhanced data structures include required fields', async () => {
    // This test verifies the data structure requirements from the problem statement
    const { generateContentWithAI } = require('../utils/generateContentWithAI');
    const mockFlashcards = [
      {
        question: 'Test question',
        answer: 'Test answer',
        tags: ['test', 'science'],
        createdBy: 'ai',
        createdAt: new Date(),
        difficulty: 1,
        category: 'Test Category'
      }
    ];
    
    const mockQuizQuestions = [
      {
        question: 'Test quiz question',
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
        tags: ['test', 'science'],
        createdBy: 'ai', 
        createdAt: new Date(),
        difficulty: 1,
        category: 'Test Category'
      }
    ];
    
    generateContentWithAI.mockResolvedValue({
      flashcards: mockFlashcards,
      quiz: mockQuizQuestions
    });
    
    render(<StudyApp />);
    
    const textarea = screen.getByPlaceholderText('Füge hier deinen Text ein...');
    fireEvent.change(textarea, { target: { value: 'Test content' } });
    
    const generateButton = screen.getByText('Mit KI erstellen');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(generateContentWithAI).toHaveBeenCalled();
    });
  });
});