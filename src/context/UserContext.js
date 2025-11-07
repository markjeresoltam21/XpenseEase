// User Context - Global State Management for Authentication
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChange, getCurrentUserData } from '../services/authService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        // Get user data from Firestore
        const result = await getCurrentUserData(authUser.uid);
        if (result.success) {
          setUser({
            ...authUser,
            ...result.userData
          });
        } else {
          setUser(authUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    setUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
