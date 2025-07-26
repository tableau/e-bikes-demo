import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

export const useGA = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    if (window.gtag) {
      window.gtag('config', 'G-J9Z61G9FJ6', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}; 
