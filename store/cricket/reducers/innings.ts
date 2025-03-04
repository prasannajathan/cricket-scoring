import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState } from '@/types';
// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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
            
            // Set match result (your existing logic)
            if (currentInnings.totalRuns >= (state.targetScore || 0)) {
                const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
                state.matchResult = `${battingTeam.teamName} wins by ${10 - currentInnings.wickets} wickets`;
            } else {
                const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
                state.matchResult = `${bowlingTeam.teamName} wins by ${state.targetScore! - currentInnings.totalRuns - 1} runs`;
            }
        }
        // First innings completion is now handled by startInnings2
    },

    checkInningsCompletion: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        // Guard against checking incomplete innings
        if (!currentInnings.battingTeamId || !currentInnings.bowlingTeamId) {
            return;
        }
        
        // Check for completion conditions
        const allOut = currentInnings.wickets >= state.totalPlayers - 1;  
        const oversComplete = currentInnings.completedOvers >= state.totalOvers;
        const targetReached = state.currentInning === 2 && 
                              state.targetScore && 
                              currentInnings.totalRuns >= state.targetScore;
        
        if (allOut || oversComplete || targetReached) {
            // Don't mark the first innings as completed here - let startInnings2 handle that
            if (state.currentInning === 2) {
                state.innings2.isCompleted = true;
                state.matchOver = true;

                // Set match result
                if (currentInnings.totalRuns >= (state.targetScore || 0)) {
                    const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
                    state.matchResult = `${battingTeam.teamName} wins by ${state.totalPlayers - 1 - currentInnings.wickets} wickets`;
                } else {
                    const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
                    state.matchResult = `${bowlingTeam.teamName} wins by ${state.targetScore! - currentInnings.totalRuns - 1} runs`;
                }
            }
            // For first innings, just set a flag for the UI but don't mark as completed
            else {
                state.innings1.readyForInnings2 = true;
            }
        }
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

    startInnings2: (state: ScoreboardState) => {
        // Set current inning to 2
        state.currentInning = 2;
        
        // Swap the batting and bowling teams
        state.innings2.battingTeamId = state.innings1.bowlingTeamId;
        state.innings2.bowlingTeamId = state.innings1.battingTeamId;
        
        // Mark first innings as complete
        state.innings1.isCompleted = true;
        
        // Reset the ball count for the new innings
        state.innings2.ballInCurrentOver = 0;
        state.innings2.completedOvers = 0;
        
        // Target score for second innings
        state.targetScore = state.innings1.totalRuns + 1;
        
        // Update the isBatting and isBowling flags on the teams
        state.teamA.isBatting = state.innings2.battingTeamId === state.teamA.id;
        state.teamA.isBowling = !state.teamA.isBatting;
        state.teamB.isBatting = !state.teamA.isBatting;
        state.teamB.isBowling = !state.teamB.isBatting;
    },
};