import React from 'react';
import { render } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

test('renders children when authenticated', () => {
  // Provide a mock AuthContext value
  const mockAuth = {
    user: { id: '1', username: 'testuser' },
    loading: false,
    isAuthenticated: () => true,
    login: jest.fn(),
    logout: jest.fn(),
    getAuthHeaders: jest.fn(),
    token: 'mocktoken',
  };

  const { getByText } = render(
    <AuthContext.Provider value={mockAuth}>
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    </AuthContext.Provider>
  );
  expect(getByText(/Protected Content/i)).toBeInTheDocument();
});