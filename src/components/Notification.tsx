import React, { useEffect, useState } from 'react';
import { useNotification } from '../hooks/useNotification';

const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const ICONS = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  info: <InfoIcon />,
};

const COLORS = {
  success: 'bg-green-500/90 text-white',
  error: 'bg-red-500/90 text-white',
  info: 'bg-slate-700/90 text-white',
};

export const Notification: React.FC = () => {
  const { notification, hideNotification } = useNotification();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
        const exitTimer = setTimeout(hideNotification, 300); // match animation duration
        return () => clearTimeout(exitTimer);
      }, 4000); // 4s visible
      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification]);

  if (!notification) {
    return null;
  }

  const animationClass = isExiting ? 'animate-fade-out-up' : 'animate-fade-in-down';
  const colorClass = COLORS[notification.type];
  const icon = ICONS[notification.type];
  
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] p-4 rounded-2xl shadow-lg flex items-center gap-3 backdrop-blur-sm ${colorClass} ${animationClass}`}
      role="alert"
    >
      {icon}
      <span className="font-semibold">{notification.message}</span>
    </div>
  );
};
