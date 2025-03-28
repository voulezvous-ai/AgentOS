import { render, screen } from '@testing-library/react';
import App from '../App';

test('App renderiza sem crash e contém texto base', () => {
  render(<App />);
  const element = screen.getByText(/voulezvous|agentos/i);
  expect(element).toBeInTheDocument();
});