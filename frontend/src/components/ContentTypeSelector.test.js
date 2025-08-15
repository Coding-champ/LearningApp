import { render, screen, fireEvent } from '@testing-library/react';
import ContentTypeSelector from '../components/ContentTypeSelector';

test('ContentTypeSelector renders all options', () => {
  const mockOnTypeChange = jest.fn();
  
  render(
    <ContentTypeSelector
      selectedType="both"
      onTypeChange={mockOnTypeChange}
    />
  );
  
  expect(screen.getByText(/Beide/i)).toBeInTheDocument();
  expect(screen.getByText('Karteikarten')).toBeInTheDocument();
  expect(screen.getAllByText(/Quiz/i).length).toBeGreaterThan(0); // Quiz appears in multiple places
});

test('ContentTypeSelector calls onTypeChange when option is clicked', () => {
  const mockOnTypeChange = jest.fn();
  
  render(
    <ContentTypeSelector
      selectedType="both"
      onTypeChange={mockOnTypeChange}
    />
  );
  
  const flashcardsButton = screen.getByText(/Nur Flashcards/i).closest('button');
  fireEvent.click(flashcardsButton);
  
  expect(mockOnTypeChange).toHaveBeenCalledWith('flashcards');
});

test('ContentTypeSelector shows selected state correctly', () => {
  const mockOnTypeChange = jest.fn();
  
  render(
    <ContentTypeSelector
      selectedType="flashcards"
      onTypeChange={mockOnTypeChange}
    />
  );
  
  const flashcardsButton = screen.getByText(/Nur Flashcards/i).closest('button');
  expect(flashcardsButton).toHaveClass('border-blue-500');
});