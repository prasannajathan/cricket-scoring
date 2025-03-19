// src/hooks/useLoadMatch.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSavedMatch } from '@/utils/matchStorage';
import { loadSavedMatch } from '@/store/cricket/scoreboardSlice';

export function useLoadMatch(matchId?: string) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!matchId) return;
    (async () => {
      try {
        const matchData = await getSavedMatch(matchId);
        if (matchData) {
          dispatch(loadSavedMatch(matchData));
        }
      } catch (error) {
        console.error('Error loading match:', error);
      }
    })();
  }, [matchId, dispatch]);
}