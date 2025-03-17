import { PayloadAction } from '@reduxjs/toolkit';
import { initialState } from '@/store/cricket/initialState';
import { ScoreboardState, SavedMatch, Team } from '@/types';

export const matchSetupReducers = {
    setTeamName: (state: ScoreboardState, action: PayloadAction<{ team: 'teamA' | 'teamB'; name: string }>) => {
        state[action.payload.team].teamName = action.payload.name;
    },

    setTeam: (state: ScoreboardState, action: PayloadAction<{ team: 'teamA' | 'teamB', teamData: Team }>) => {
        const { team, teamData } = action.payload;
        state[team] = teamData;
      },

    setTossWinner: (state: ScoreboardState, action: PayloadAction<'teamA' | 'teamB'>) => {
        state.tossWinner = action.payload;
        if (action.payload === 'teamA') {
            state.teamA.tossWinner = true;
            state.teamB.tossWinner = false;
        } else {
            state.teamA.tossWinner = false;
            state.teamB.tossWinner = true;
        }
    },

    setTossChoice: (state: ScoreboardState, action: PayloadAction<'bat' | 'bowl'>) => {
        state.tossChoice = action.payload;
        const battingTeam = state.tossChoice === 'bat' ? state.tossWinner : (state.tossWinner === 'teamA' ? 'teamB' : 'teamA');
        
        state.teamA.isBatting = battingTeam === 'teamA';
        state.teamA.isBowling = !state.teamA.isBatting;
        state.teamB.isBatting = !state.teamA.isBatting;
        state.teamB.isBowling = !state.teamB.isBatting;

        state.innings1.battingTeamId = state[battingTeam].id;
        state.innings1.bowlingTeamId = state[battingTeam === 'teamA' ? 'teamB' : 'teamA'].id;
    },

    setTotalOvers: (state: ScoreboardState, action: PayloadAction<number>) => {
        state.totalOvers = action.payload;
    },

    initializeMatch: (state: ScoreboardState) => {
        state.currentInning = 1;
        state.matchOver = false;
        state.matchResult = undefined;
        state.targetScore = undefined;
    },

    clearMatchResult: (state: ScoreboardState) => {
        state.matchResult = undefined;
        state.matchOver = false;
    },

    resetGame: () => initialState,

    setMatchResult: (state: ScoreboardState, action: PayloadAction<string>) => {
        state.matchResult = action.payload;
    },
    
    setMatchOver: (state: ScoreboardState, action: PayloadAction<boolean>) => {
        state.matchOver = action.payload;
    },
    
    loadSavedMatch: (state: ScoreboardState, action: PayloadAction<SavedMatch>) => {
        // Load all saved match data into state
        return {
            ...state,
            ...action.payload,
            // Ensure we keep the proper references
            teamA: {
                ...action.payload.teamA,
                players: [...action.payload.teamA.players]
            },
            teamB: {
                ...action.payload.teamB,
                players: [...action.payload.teamB.players]
            },
            innings1: {
                ...action.payload.innings1,
                deliveries: [...action.payload.innings1.deliveries]
            },
            innings2: {
                ...action.payload.innings2,
                deliveries: [...action.payload.innings2.deliveries]
            }
        };
    }
};