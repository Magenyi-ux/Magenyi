import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Check for session on initial load

    useEffect(() => {
        // Use a slight delay to prevent flicker on fast reloads
        const timer = setTimeout(() => {
            const user = authService.getCurrentUserSession();
            if (user) {
                setCurrentUser(user);
            }
            setIsLoading(false);
        }, 250); // 250ms delay
        return () => clearTimeout(timer);
    }, []);

    const signup = async (username: string, email: string, password: string) => {
        await authService.signup(username, email, password);
        // After signup, automatically log in
        await login(email, password);
    };

    const login = async (email: string, password: string) => {
        const user = await authService.login(email, password);
        setCurrentUser(user);
        // The service now handles session/cookie persistence
    };

    const logout = () => {
        authService.logout();
        setCurrentUser(null);
    };
    
    const value = {
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
