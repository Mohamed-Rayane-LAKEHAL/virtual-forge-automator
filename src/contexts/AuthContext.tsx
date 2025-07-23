
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/vm';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking authentication status...');
        const response = await apiService.checkAuth();
        console.log('Auth check response:', response);
        if (response.authenticated && response.user) {
          setUser(response.user);
          console.log('User authenticated:', response.user);
        } else {
          console.log('User not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string) => {
    const userData = { username };
    setUser(userData);
    console.log('User logged in:', userData);
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      setUser(null);
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
