import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('sh_lang') || 'en';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('sh_lang', lang);
  };

  const t = (key) => {
    const langObj = translations[language] || translations.en;
    const fallbackObj = translations.en;
    
    // Support nested keys like 'nav.services'
    const getNested = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
    
    return getNested(langObj, key) || getNested(fallbackObj, key) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
