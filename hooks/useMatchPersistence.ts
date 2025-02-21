import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { saveMatch, getCurrentMatch } from '@/utils/matchStorage';
import { loadSavedMatch } from '@/store/cricket/scoreboardSlice';

export const useMatchPersistence = (matchId?: string) => {
    const dispatch = useDispatch();
    const matchState = useSelector((state: RootState) => state.scoreboard);

    useEffect(() => {
        const loadMatch = async () => {
            if (matchId) {
                const currentMatch = await getCurrentMatch();
                if (currentMatch && currentMatch.id === matchId) {
                    dispatch(loadSavedMatch(currentMatch));
                }
            }
        };

        loadMatch();
    }, [matchId]);

    useEffect(() => {
        if (matchState.id) {
            saveMatch({
                ...matchState,
                date: new Date().toISOString(),
                completed: matchState.matchOver
            });
        }
    }, [matchState]);

    return null;
};