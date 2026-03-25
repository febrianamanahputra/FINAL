import { useState, useEffect, useCallback } from 'react';
import { AppState, defaultState, LocData } from './types';

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('proj_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return defaultState;
  });

  useEffect(() => {
    try {
      localStorage.setItem('proj_v2', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [state]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater);
  }, []);

  const getLocData = useCallback((locId: string | null): LocData => {
    if (!locId) return { reports: [], materials: [], dana: [], catatan: [], links: [], areas: [], pekerjaan: [] };
    const data = state.locData[locId] || {};
    return {
      reports: data.reports || [],
      materials: data.materials || [],
      dana: data.dana || [],
      catatan: data.catatan || [],
      links: data.links || [],
      areas: data.areas || [],
      pekerjaan: data.pekerjaan || [],
      ...data
    };
  }, [state.locData]);

  const updateLocData = useCallback((locId: string, updater: (prev: LocData) => LocData) => {
    setState(prev => {
      const currentLocData = prev.locData[locId] || { reports: [], materials: [], dana: [], catatan: [], links: [], areas: [], pekerjaan: [] };
      return {
        ...prev,
        locData: {
          ...prev.locData,
          [locId]: updater(currentLocData)
        }
      };
    });
  }, []);

  return { state, updateState, getLocData, updateLocData };
}
