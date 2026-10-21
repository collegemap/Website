import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});

