import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  startDate?: string;
  role?: 'employee' | 'manager' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  signUp: (email: string, password: string, userData?: { 
    firstName?: string; 
    lastName?: string; 
    displayName?: string; 
    phone?: string; 
    department?: string; 
    jobTitle?: string; 
    startDate?: string; 
    role?: 'employee' | 'manager' 
  }) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  showWelcomeBack: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for test user in localStorage
    const testUserData = localStorage.getItem('testUser');
    if (testUserData) {
      const testUser = JSON.parse(testUserData);
      setUser(testUser);
      setIsLoading(false);
      // Don't auto-redirect - let the login page control navigation
    } else {
      // No user found
      setIsLoading(false);
    }
  }, []);


  // Convert the API's { id, email, user_metadata } shape into an AuthUser and
  // persist it as the active session.
  const persistSession = (apiUser: any): AuthUser => {
    const meta = apiUser.user_metadata ?? {};
    const authUser: AuthUser = {
      id: String(apiUser.id),
      email: apiUser.email,
      displayName: meta.displayName,
      firstName: meta.firstName,
      lastName: meta.lastName,
      department: meta.department,
      jobTitle: meta.jobTitle,
      role: meta.role,
    };
    localStorage.setItem('testUser', JSON.stringify(authUser));
    setUser(authUser);
    return authUser;
  };

  const signUp = async (email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    department?: string;
    jobTitle?: string;
    startDate?: string;
    role?: 'employee' | 'manager'
  }) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...userData }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: new Error(data?.message || 'Failed to sign up') };
      }
      // Sign the new user in immediately.
      const authUser = persistSession({ ...data.user, user_metadata: {
        displayName: data.user.displayName,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        department: data.user.department,
        jobTitle: data.user.jobTitle,
      }});
      return { data: { user: authUser }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: new Error(data?.message || 'Invalid email or password') };
      }
      const authUser = persistSession(data.user);
      return { data: { user: authUser }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    // Clear test user from localStorage
    localStorage.removeItem('testUser');
    setUser(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      signUp,
      signIn,
      signOut,
      isLoading,
      showWelcomeBack: false
    }}>
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