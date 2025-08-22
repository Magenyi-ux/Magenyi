

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Activity, ActivityType } from '../types';

export const useActivityLogger = () => {
  const [, setActivities] = useLocalStorage<Activity[]>('activities', []);

  const logActivity = useCallback((type: ActivityType, details: Record<string, any> = {}) => {
    const newActivity: Activity = {
      id: new Date().toISOString() + Math.random(),
      type,
      timestamp: Date.now(),
      details,
    };
    setActivities(prevActivities => [newActivity, ...prevActivities]);
  }, [setActivities]);

  return { logActivity };
};