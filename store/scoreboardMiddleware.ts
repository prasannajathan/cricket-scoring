import { 
    scoreBall, 
    undoLastBall,
    endInnings, 
    resetGame,
    retireBatsman,
    swapBatsmen,
    addExtraRuns,
    setBowler,
    setCurrentStriker,
    setCurrentNonStriker
} from '@/store/cricket/scoreboardSlice';
import { saveMatch } from '@/utils/matchStorage';
import { SavedMatch } from '@/types';
import { RootState } from '@/store';
import { AnyAction } from '@reduxjs/toolkit';

// Create a type for the action types to avoid errors
type SaveActionType = 
    typeof scoreBall.type | 
    typeof undoLastBall.type |
    typeof endInnings.type |
    typeof resetGame.type |
    typeof retireBatsman.type |
    typeof swapBatsmen.type |
    typeof addExtraRuns.type |
    typeof setBowler.type |
    typeof setCurrentStriker.type |
    typeof setCurrentNonStriker.type;

// Define the actions that should trigger a save (with proper typing)
const saveActions: SaveActionType[] = [
    scoreBall.type,
    undoLastBall.type,
    endInnings.type,
    resetGame.type,
    retireBatsman.type,
    swapBatsmen.type,
    addExtraRuns.type,
    setBowler.type,
    setCurrentStriker.type,
    setCurrentNonStriker.type
];

export const scoreboardMiddleware = (store: any) => (next: any) => (action: AnyAction) => {
    const result = next(action);

    // Check if this action should trigger a save
    // Using type assertion to assure TypeScript this is safe
    if (saveActions.includes(action.type as SaveActionType)) {
        const state: RootState = store.getState();
        if (state.scoreboard.id) {
            // Ensure all required properties from SavedMatch are included
            const matchData: SavedMatch = {
                // Include all necessary properties from state.scoreboard
                ...state.scoreboard,
                id: state.scoreboard.id,
                name: `${state.scoreboard.teamA.teamName} vs ${state.scoreboard.teamB.teamName}`,
                timestamp: Date.now(),
                completed: state.scoreboard.matchOver
            };

            // Save the properly typed match object
            saveMatch(matchData);
        }
    }

    return result;
};