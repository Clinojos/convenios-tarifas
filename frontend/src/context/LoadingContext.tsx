"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: (val: boolean) => {}
});

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => useContext(LoadingContext);