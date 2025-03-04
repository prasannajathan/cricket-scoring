import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState } from '@/types';
import { initialState } from './initialState';
import { matchSetupReducers } from './reducers/matchSetup';
import { scoringReducers } from './reducers/scoring';
import { inningsReducers } from './reducers/innings';
import { playerReducers } from './reducers/players';

export const scoreboardSlice = createSlice({
    name: 'scoreboard',
    initialState: initialState as unknown as ScoreboardState,
    reducers: {
        ...matchSetupReducers,
        ...scoringReducers,
        ...inningsReducers,
        ...playerReducers
    }
});

// Export all actions
export const {
    setTeamName,
    setTossWinner,
    setTossChoice,
    setTotalOvers,
    initializeInnings,
    startInnings2,
    setCurrentStriker,
    setCurrentNonStriker,
    addPlayer,
    editPlayerName,
    scoreBall,
    incrementOvers,
    wicketFallen,
    swapBatsmen,
    undoLastBall,
    setBowler,
    retireBatsman,
    addExtraRuns,
    endInnings,
    clearMatchResult,
    resetGame,
    setMatchResult,
    setMatchOver,
    updateInningsPlayers,
    loadSavedMatch
} = scoreboardSlice.actions;

export default scoreboardSlice.reducer;