import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState } from '@/types';
// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { checkInningsCompletionHelper, calculateMatchResult, playerStats } from '@/utils';

export const inningsReducers = {
    initializeInnings: (state: ScoreboardState, action: PayloadAction<{ battingTeamId: string; bowlingTeamId: string }>) => {
        const { battingTeamId, bowlingTeamId } = action.payload;
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;

        currentInnings.id = uuidv4();
        currentInnings.battingTeamId = battingTeamId;
        currentInnings.bowlingTeamId = bowlingTeamId;
        currentInnings.totalRuns = 0;
        currentInnings.wickets = 0;
        currentInnings.completedOvers = 0;
        currentInnings.ballInCurrentOver = 0;
        currentInnings.extras = 0;
        currentInnings.partnerships = [];
        currentInnings.deliveries = [];
        currentInnings.isCompleted = false;
        currentInnings.currentBowlerId = undefined;
        currentInnings.currentStrikerId = undefined;
        currentInnings.currentNonStrikerId = undefined;
        currentInnings.lastOverBowlerId = undefined;
    },

    endInnings: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;

        // Guard against ending innings that haven't been properly initialized
        if (!currentInnings.battingTeamId || !currentInnings.bowlingTeamId) {
            return; // Don't mark as completed if innings hasn't been initialized
        }

        currentInnings.isCompleted = true;

        if (state.currentInning === 2) {
            // Match is over
            state.matchOver = true;

            // Use centralized function to calculate result
            calculateMatchResult(state);
        }
        // First innings completion is handled by startInnings2
    },

    checkInningsCompletion: (state: ScoreboardState) => {
        checkInningsCompletionHelper(state);
    },

    wicketFallen: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        currentInnings.wickets += 1;
    },

    incrementOvers: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        currentInnings.completedOvers += 1;
        currentInnings.ballInCurrentOver = 0;
    },

    setCurrentInning: (state: ScoreboardState, action: PayloadAction<1 | 2>) => {
        state.currentInning = action.payload;
    },

    resetPlayerStats: (state: ScoreboardState, action: PayloadAction<{ team: 'teamA' | 'teamB', playerId: string }>) => {
        const { team, playerId } = action.payload;

        const playerIndex = state[team].players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            // Reset only the match statistics, preserve player identity
            state[team].players[playerIndex] = {
                ...state[team].players[playerIndex],
                ...playerStats,
            };
        }
    },

    startInnings2: (state: ScoreboardState) => {
        // Set current inning to 2
        state.currentInning = 2;

        // Explicitly swap the batting and bowling teams
        state.innings2.battingTeamId = state.innings1.bowlingTeamId;
        state.innings2.bowlingTeamId = state.innings1.battingTeamId;

        // Update the isBatting and isBowling flags on the teams
        if (state.innings2.battingTeamId === state.teamA.id) {
            state.teamA.isBatting = true;
            state.teamA.isBowling = false;
            state.teamB.isBatting = false;
            state.teamB.isBowling = true;
        } else {
            state.teamA.isBatting = false;
            state.teamA.isBowling = true;
            state.teamB.isBatting = true;
            state.teamB.isBowling = false;
        }

        // Mark first innings as complete
        state.innings1.isCompleted = true;

        // Reset the ball count for the new innings
        state.innings2.ballInCurrentOver = 0;
        state.innings2.completedOvers = 0;

        // CRITICAL: Set target score for second innings
        state.targetScore = state.innings1.totalRuns + 1;

    },

    setTargetScore: (state: ScoreboardState, action: PayloadAction<number>) => {
        state.targetScore = action.payload;
        console.log("Target score set to:", state.targetScore);
    }
};