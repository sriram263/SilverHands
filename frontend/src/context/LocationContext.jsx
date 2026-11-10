import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [city, setCity] = useState('Chennai');
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);

  const setLocation = (cityName, latitude, longitude) => {
    setCity(cityName);
    if (latitude) setLat(latitude);
    if (longitude) setLng(longitude);
  };

  return (
    <LocationContext.Provider value={{ city, lat, lng, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
