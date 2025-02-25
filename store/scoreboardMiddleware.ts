import { 
    scoreBall, 
    endInnings, 
    resetGame 
} from '@/store/cricket/scoreboardSlice';
import { saveMatch } from '@/utils/matchStorage';
import { RootState } from '@/store';

export const scoreboardMiddleware = (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    if (action.type.startsWith('scoreboard/')) {
        const state: RootState = store.getState();
        saveMatch({
            matchDetails: state.scoreboard.matchDetails,
            teams: state.scoreboard.teams,
            innings: state.scoreboard.innings,
            id: state.scoreboard.matchDetails.id,
            date: new Date().toISOString(),
            completed: state.scoreboard.matchDetails.matchOver
        });
    }

    return result;
};