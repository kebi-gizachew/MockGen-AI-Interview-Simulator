import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService, LoginParams, RegisterParams } from '../services/auth.service';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (params: LoginParams) => Promise<User>;
  register: (params: RegisterParams) => Promise<User>;
  /** Complete a session handed back by an external flow (Google OAuth). */
  completeExternalLogin: (token: string, user: User) => void;
  /** Replace the cached user (e.g. after email verification). */
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
  );

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          setUserState(res.data.user);
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        } catch (error) {
          console.error('Session verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (params: LoginParams): Promise<User> => {
    const res = await authService.login(params);
    const { user: loggedInUser, token: authToken } = res.data;

    setToken(authToken);
    setUserState(loggedInUser);
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, authToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const register = async (params: RegisterParams): Promise<User> => {
    const res = await authService.register(params);
    const { user: registeredUser, token: authToken } = res.data;

    setToken(authToken);
    setUserState(registeredUser);
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, authToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(registeredUser));
    return registeredUser;
  };

  const completeExternalLogin = (externalToken: string, externalUser: User) => {
    setToken(externalToken);
    setUserState(externalUser);
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, externalToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(externalUser));
  };

  const setUser = (updatedUser: User | null) => {
    setUserState(updatedUser);
    if (updatedUser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        completeExternalLogin,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
