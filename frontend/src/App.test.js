import { render, screen } from '@testing-library/react';
import App from './App';

test('renders StudyMaster title', () => {
  render(<App />);
  const titleElement = screen.getByText(/StudyMaster/i);
  expect(titleElement).toBeInTheDocument();
});
