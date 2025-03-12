import { type User } from '@/api/auth';
import React, { createContext, useState } from 'react';

export interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
}

export const UserContext = createContext<UserStore>({
  user: null,
  isAuthenticated: false,
  setUser: (user) => {
    console.error(
      'setUser has not been initialized. Did you wrapped your component in a UserContextProvider?'
    );
  }
});

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const _setUser = (user: User) => {
    setUser(user);
    setIsAuthenticated(user == null);
  };
  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        setUser: _setUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
