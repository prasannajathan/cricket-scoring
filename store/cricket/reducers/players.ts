import { PayloadAction } from '@reduxjs/toolkit';
// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Cricketer, ScoreboardState } from '@/types';

interface UpdateInningsPlayersPayload {
    currentStrikerId: string;
    currentNonStrikerId: string;
    currentBowlerId: string;
    inningNumber: 1 | 2;
}

export const playerReducers = {
    addPlayer: (
        state: ScoreboardState,
        action: PayloadAction<{ team: 'teamA' | 'teamB'; player: Cricketer }>
    ) => {
        const { team, player } = action.payload;
        state[team].players.push({
            ...player,
            id: player.id || uuidv4(),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            isOut: false,
            // isRetired: false,
            overs: 0,
            ballsThisOver: 0,
            runsConceded: 0,
            wickets: 0,
            economy: 0,
            maidens: 0
        });
    },

    setCurrentStriker: (
        state: ScoreboardState,
        action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string }>
    ) => {
        const { team, playerId } = action.payload;
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        if (state[team].id === currentInnings.battingTeamId) {
            currentInnings.currentStrikerId = playerId;
            state[team].currentStrikerId = playerId;
        }
    },

    setCurrentNonStriker: (
        state: ScoreboardState,
        action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string }>
    ) => {
        const { team, playerId } = action.payload;
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        if (state[team].id === currentInnings.battingTeamId) {
            currentInnings.currentNonStrikerId = playerId;
            state[team].currentNonStrikerId = playerId;
        }
    },

    setBowler: (
        state: ScoreboardState,
        action: PayloadAction<{ team: 'teamA' | 'teamB'; bowlerId: string }>
    ) => {
        const { team, bowlerId } = action.payload;
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        if (state[team].id === currentInnings.bowlingTeamId) {
            // Check if bowler bowled last over
            if (bowlerId === currentInnings.lastOverBowlerId) {
                return; // Cannot bowl consecutive overs
            }
            
            currentInnings.currentBowlerId = bowlerId;
            state[team].currentBowlerId = bowlerId;
        }
    },

    editPlayerName: (
        state: ScoreboardState,
        action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string; newName: string }>
    ) => {
        const { team, playerId, newName } = action.payload;
        const player = state[team].players.find(p => p.id === playerId);
        if (player) {
            player.name = newName;
        }
    },

    updatePlayerStats: (
        state: ScoreboardState,
        action: PayloadAction<{ 
            team: 'teamA' | 'teamB'; 
            playerId: string;
            stats: Partial<Cricketer>
        }>
    ) => {
        const { team, playerId, stats } = action.payload;
        const player = state[team].players.find(p => p.id === playerId);
        if (player) {
            Object.assign(player, stats);
        }
    },

    updateInningsPlayers: (
        state: ScoreboardState, 
        action: PayloadAction<UpdateInningsPlayersPayload>
    ) => {
        const { currentStrikerId, currentNonStrikerId, currentBowlerId, inningNumber } = action.payload;
        const currentInnings = state[`innings${inningNumber}`];
        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];

        // Update innings state
        currentInnings.currentStrikerId = currentStrikerId;
        currentInnings.currentNonStrikerId = currentNonStrikerId;
        currentInnings.currentBowlerId = currentBowlerId;

        // Update team state
        battingTeam.currentStrikerId = currentStrikerId;
        battingTeam.currentNonStrikerId = currentNonStrikerId;
        bowlingTeam.currentBowlerId = currentBowlerId;
    },
    swapBatsman: (state: ScoreboardState) => {
        const battingTeam = state.teamA.isBatting ? state.teamA : state.teamB;
        const tmp = battingTeam.currentStrikerId;
        battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
        battingTeam.currentNonStrikerId = tmp;
    },
};