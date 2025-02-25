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
        if (state.currentInning === 1) {
            state.innings1.isCompleted = true;
            state.currentInning = 2;
            state.targetScore = state.innings1.totalRuns + 1;

            // Set up second innings
            const firstInningsBattingTeamId = state.innings1.battingTeamId;
            state.innings2.battingTeamId = state.innings1.bowlingTeamId;
            state.innings2.bowlingTeamId = firstInningsBattingTeamId;

            // Switch team roles
            state.teamA.isBatting = state.teamA.id === state.innings2.battingTeamId;
            state.teamA.isBowling = !state.teamA.isBatting;
            state.teamB.isBatting = !state.teamA.isBatting;
            state.teamB.isBowling = !state.teamB.isBatting;

            // Reset player stats for second innings
            const nextBattingTeam = state[state.innings2.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
            nextBattingTeam.players.forEach(player => {
                player.runs = 0;
                player.balls = 0;
                player.fours = 0;
                player.sixes = 0;
                player.strikeRate = 0;
                player.isOut = false;
                player.isRetired = false;
            });

            const nextBowlingTeam = state[state.innings2.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
            nextBowlingTeam.players.forEach(player => {
                player.overs = 0;
                player.ballsThisOver = 0;
                player.runsConceded = 0;
                player.wickets = 0;
                player.economy = 0;
                player.maidens = 0;
            });
        }
    },

    checkInningsCompletion: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        if (currentInnings.wickets >= 10 || 
            currentInnings.completedOvers >= state.totalOvers ||
            (state.currentInning === 2 && state.targetScore && currentInnings.totalRuns >= state.targetScore)) {
            
            if (state.currentInning === 1) {
                state.innings1.isCompleted = true;
            } else {
                state.innings2.isCompleted = true;
                state.matchOver = true;

                // Set match result
                if (currentInnings.totalRuns >= (state.targetScore || 0)) {
                    const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
                    state.matchResult = `${battingTeam.teamName} wins by ${10 - currentInnings.wickets} wickets`;
                } else {
                    const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
                    state.matchResult = `${bowlingTeam.teamName} wins by ${state.targetScore! - currentInnings.totalRuns - 1} runs`;
                }
            }
        }
    },

    wicketFallen: (state) => {
        const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
        battingTeam.wickets += 1;
    },

    incrementOvers: (state) => {
        const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
        battingTeam.completedOvers += 1;
        battingTeam.ballInCurrentOver = 0;
    },
};