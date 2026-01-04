'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le token au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('vulnex_token');
    const storedUser = localStorage.getItem('vulnex_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'Login failed');
      }

      // Structure Supabase: data.data.session.access_token et data.data.user
      const { session, user: newUser } = data.data;
      const newToken = session?.access_token;

      if (!newToken) {
        throw new Error('No access token received');
      }

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('vulnex_token', newToken);
      localStorage.setItem('vulnex_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Register response:', data); // Debug

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'Registration failed');
      }

      // Structure Supabase: data.data.session.access_token et data.data.user
      const { session, user: newUser } = data.data;
      const newToken = session?.access_token;

      // Si pas de token, c'est que l'email doit être confirmé
      // Mais on accepte quand même l'inscription (sans connexion auto)
      if (!newToken) {
        // Compte créé mais pas de session - rediriger vers login
        throw new Error('Account created! Please login with your credentials.');
      }

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('vulnex_token', newToken);
      localStorage.setItem('vulnex_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vulnex_token');
    localStorage.removeItem('vulnex_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
