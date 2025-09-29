"use client"; 

import { createContext, useContext, useState, ReactNode } from "react";


interface User {
  id: string;
  name: string;
  email: string;
}


interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
}


const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {}, 
});


interface AuthProviderProps {
  children: ReactNode;
}


export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const value = { user, login };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export const useAuth = () => {
  return useContext(AuthContext);
};