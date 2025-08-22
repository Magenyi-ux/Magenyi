
import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { NotificationMessage, NotificationType } from '../types';

interface NotificationContextType {
  notification: NotificationMessage | null;
  showNotification: (message: string, type?: NotificationType) => void;
  hideNotification: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationMessage | null>(null);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);
  
  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
  }, []);
  
  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
