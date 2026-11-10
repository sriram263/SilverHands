import React, { createContext, useContext, useState, useEffect } from 'react';

const SeniorModeContext = createContext();

export const SeniorModeProvider = ({ children }) => {
  const [isSeniorMode, setIsSeniorMode] = useState(() => {
    return localStorage.getItem('sh_senior_mode') === 'true';
  });

  useEffect(() => {
    if (isSeniorMode) {
      document.body.classList.add('senior-mode');
    } else {
      document.body.classList.remove('senior-mode');
    }
    localStorage.setItem('sh_senior_mode', isSeniorMode);
  }, [isSeniorMode]);

  const toggleSeniorMode = () => setIsSeniorMode((prev) => !prev);

  return (
    <SeniorModeContext.Provider value={{ isSeniorMode, toggleSeniorMode, setIsSeniorMode }}>
      {children}
    </SeniorModeContext.Provider>
  );
};

export const useSeniorMode = () => useContext(SeniorModeContext);
