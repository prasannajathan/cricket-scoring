// store/scoreboardSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
    Team,
    ScoreboardState,
    Cricketer,
    ScoreBallPayload,
    DeliveryEvent,
    PartnershipRecord
} from '@/types';

interface ExtendedTeam extends Team {
    activePartnership?: PartnershipRecord | null;
    lastOverBowlerId?: string;
}

interface ExtendedScoreboardState extends Omit<ScoreboardState, 'teamA' | 'teamB'> {
    teamA: ExtendedTeam;
    teamB: ExtendedTeam;
}

interface ScoreboardSnapshot extends ScoreboardState { }

const initialTeamState: ExtendedTeam = {
    id: uuidv4() + '_team',
    teamName: '',
    players: [],
    tossWinner: false,
    batting: false,
    bowling: false,

    completedOvers: 0,
    ballInCurrentOver: 0,
    totalRuns: 0,
    wickets: 0,
    extras: 0,
    deliveries: [],

    currentBowlerId: undefined,
    currentStrikerId: '',
    currentNonStrikerId: '',
    openingStriker: '',
    openingNonStriker: '',
    openingBowler: '',

    currentPartnership: 0,
    partnerships: [],

    isDeclared: false,
    isAllOut: false,
    isCompleted: false,

    activePartnership: null,
    lastOverBowlerId: undefined,


};

const initialState: ScoreboardState = {
    id: uuidv4(),
    teamA: {
        id: uuidv4(),
        teamName: 'Team A',
        players: [],
        isBatting: false,
        isBowling: false,
        tossWinner: false,
        currentBowlerId: undefined,
        currentStrikerId: undefined,
        currentNonStrikerId: undefined,
        lastOverBowlerId: undefined
    },
    teamB: {
        id: uuidv4(),
        teamName: 'Team B',
        players: [],
        isBatting: false,
        isBowling: false,
        tossWinner: false,
        currentBowlerId: undefined,
        currentStrikerId: undefined,
        currentNonStrikerId: undefined,
        lastOverBowlerId: undefined
    },
    tossWinner: 'teamA',
    tossChoice: 'bat',
    totalOvers: 1,
    currentInning: 1,
    totalPlayers: 11,
    innings1: {
        id: uuidv4(),
        battingTeamId: '',
        bowlingTeamId: '',
        totalRuns: 0,
        wickets: 0,
        completedOvers: 0,
        ballInCurrentOver: 0,
        extras: 0,
        partnerships: [],
        deliveries: [],
        isCompleted: false,
        currentBowlerId: undefined,
        currentStrikerId: undefined,
        currentNonStrikerId: undefined,
        lastOverBowlerId: undefined
    },
    innings2: {
        id: uuidv4(),
        battingTeamId: '',
        bowlingTeamId: '',
        totalRuns: 0,
        wickets: 0,
        completedOvers: 0,
        ballInCurrentOver: 0,
        extras: 0,
        partnerships: [],
        deliveries: [],
        isCompleted: false,
        currentBowlerId: undefined,
        currentStrikerId: undefined,
        currentNonStrikerId: undefined,
        lastOverBowlerId: undefined
    },
    matchOver: false,
    matchResult: undefined
};

// Add new action type
interface UpdateInningsPlayersPayload {
    inningNumber: 1 | 2;
    currentStrikerId: string;
    currentNonStrikerId: string;
    currentBowlerId: string;
}

export const scoreboardSlice = createSlice({
    name: 'scoreboard',
    initialState,
    reducers: {
        // ------------ NEW MATCH SCREEN ------------
        setTeamName: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; name: string }>) => {
            state[action.payload.team].teamName = action.payload.name;
        },
        setTossWinner: (state, action: PayloadAction<'teamA' | 'teamB'>) => {
            state.tossWinner = action.payload;
            if (action.payload === 'teamA') {
                state.teamA.tossWinner = true;
                state.teamB.tossWinner = false;
            } else {
                state.teamA.tossWinner = false;
                state.teamB.tossWinner = true;
            }
        },
        setTossChoice: (state, action: PayloadAction<'bat' | 'bowl'>) => {
            state.tossChoice = action.payload;
            const battingTeam = state.tossChoice === 'bat' ? state.tossWinner : (state.tossWinner === 'teamA' ? 'teamB' : 'teamA');
            
            // Set initial batting/bowling teams
            state.teamA.isBatting = battingTeam === 'teamA';
            state.teamA.isBowling = !state.teamA.isBatting;
            state.teamB.isBatting = !state.teamA.isBatting;
            state.teamB.isBowling = !state.teamB.isBatting;
        
            // Set innings1 team IDs
            state.innings1.battingTeamId = state[battingTeam].id;
            state.innings1.bowlingTeamId = state[battingTeam === 'teamA' ? 'teamB' : 'teamA'].id;
        },
        setTotalOvers: (state, action: PayloadAction<number>) => {
            state.totalOvers = action.payload;
        },

        // ---------- OPENING PLAYERS SCREEN ---------
        setCurrentStriker: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string }>
        ) => {
            state[action.payload.team].currentStrikerId = action.payload.playerId;
        },
        setCurrentNonStriker: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string }>
        ) => {
            state[action.payload.team].currentNonStrikerId = action.payload.playerId;
        },

        // --------------- ADD / EDIT PLAYERS ---------------
        addPlayer: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; player: Cricketer }>) => {
            const { team, player } = action.payload;
            // TODO: 11 to add conditionally from state.totalPlayers
            if (state[team].players.length < 11) {
                state[team].players.push(player);
            }
        },
        editPlayerName: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string; newName: string }>
        ) => {
            const { team, playerId, newName } = action.payload;
            const player = state[team].players.find((p) => p.id === playerId);
            if (player) {
                player.name = newName;
            }
        },

        // ------------- SCORE A BALL -------------
        // -- Score a Ball --
        scoreBall: (state, action: PayloadAction<ScoreBallPayload>) => {
            if (state.matchOver) return;

            const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
            const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
            const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];

            // Rest of the scoreBall logic using currentInnings instead of battingTeam for innings-specific data
            const { runs, extraType, wicket, outBatsmanId, wicketType } = action.payload;
            let totalRuns = runs;
            let legalDelivery = true;

            if (extraType === 'wide' || extraType === 'no-ball') {
                totalRuns += 1;
                currentInnings.extras += 1;
                legalDelivery = false;
            } else if (extraType === 'bye' || extraType === 'leg-bye') {
                currentInnings.extras += runs;
            }
            currentInnings.totalRuns += totalRuns;

            // Update ball counting in innings
            if (legalDelivery) {
                currentInnings.ballInCurrentOver += 1;
                if (currentInnings.ballInCurrentOver >= 6) {
                    currentInnings.completedOvers += 1;
                    currentInnings.ballInCurrentOver = 0;
                    currentInnings.lastOverBowlerId = currentInnings.currentBowlerId;
                }
            }

            // ... rest of the logic updating player stats and partnerships
        },

        incrementOvers: (state) => {
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            battingTeam.completedOvers += 1;
            battingTeam.ballInCurrentOver = 0;
        },

        wicketFallen: (state) => {
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            battingTeam.wickets += 1;
        },

        swapBatsman: (state) => {
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            const tmp = battingTeam.currentStrikerId;
            battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
            battingTeam.currentNonStrikerId = tmp;
        },

        // Undo one delivery
        undoLastBall: (state) => {
            if (!state.deliveryHistorySnapshots?.length) return;
            const prev = state.deliveryHistorySnapshots.pop();
            if (prev) {
                // Remove any stored history snapshots from the previous state to avoid nesting
                return prev as typeof state;
            }
        },

        setBowler: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; bowlerId: string }>) => {
            const team = state[action.payload.team];
            if (!team) return;

            // Clear previous bowler if any
            if (team.currentBowlerId) {
                const prevBowler = team.players.find(p => p.id === team.currentBowlerId);
                if (prevBowler) {
                    prevBowler.ballsThisOver = 0;
                }
            }

            // Set new bowler
            team.currentBowlerId = action.payload.bowlerId;
            team.lastOverBowlerId = team.currentBowlerId;

            // Initialize bowler stats if needed
            const bowler = team.players.find(p => p.id === action.payload.bowlerId);
            if (bowler) {
                bowler.ballsThisOver = 0;
                if (!bowler.overs) bowler.overs = 0;
                if (!bowler.runsConceded) bowler.runsConceded = 0;
                if (!bowler.wickets) bowler.wickets = 0;
                if (!bowler.economy) bowler.economy = 0;
            }
        },

        retireBatsman: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; batsmanId: string }>
        ) => {
            const { team, batsmanId } = action.payload;
            const t = state[team];
            const batsman = t.players.find((p) => p.id === batsmanId);
            if (!batsman) return;
            batsman.isOut = true;
            t.partnerships.push(t.currentPartnership);
            t.currentPartnership = 0;
        },

        addExtraRuns: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; runs: number }>) => {
            const { team, runs } = action.payload;
            state[team].extras += runs;
            state[team].totalRuns += runs;
        },

        endInnings: (state) => {
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

                // Clear match status
                state.matchResult = undefined;
                state.matchOver = false;
            }
        },

        clearMatchResult: (state) => {
            state.matchResult = undefined;
            state.matchOver = false;
        },

        resetGame: () => initialState,

        setMatchResult: (state, action: PayloadAction<string>) => {
            state.matchResult = action.payload;
        },
        
        setMatchOver: (state, action: PayloadAction<boolean>) => {
            state.matchOver = action.payload;
        },

        initializeInnings: (state, action: PayloadAction<{ battingTeamId: string; bowlingTeamId: string }>) => {
            const { battingTeamId, bowlingTeamId } = action.payload;
            
            // Set batting/bowling status for teams
            state.teamA.isBatting = state.teamA.id === battingTeamId;
            state.teamA.isBowling = state.teamA.id === bowlingTeamId;
            state.teamB.isBatting = state.teamB.id === battingTeamId;
            state.teamB.isBowling = state.teamB.id === bowlingTeamId;

            // Initialize innings1 data
            state.innings1 = {
                ...state.innings1,
                id: uuidv4(),
                battingTeamId,
                bowlingTeamId,
                totalRuns: 0,
                wickets: 0,
                completedOvers: 0,
                ballInCurrentOver: 0,
                extras: 0,
                partnerships: [],
                deliveries: [],
                isCompleted: false,
                currentBowlerId: undefined,
                currentStrikerId: undefined,
                currentNonStrikerId: undefined,
                lastOverBowlerId: undefined
            };

            // Reset innings2 data
            state.innings2 = {
                ...state.innings2,
                id: uuidv4(),
                battingTeamId: bowlingTeamId, // Switch for second innings
                bowlingTeamId: battingTeamId,
                totalRuns: 0,
                wickets: 0,
                completedOvers: 0,
                ballInCurrentOver: 0,
                extras: 0,
                partnerships: [],
                deliveries: [],
                isCompleted: false,
                currentBowlerId: undefined,
                currentStrikerId: undefined,
                currentNonStrikerId: undefined,
                lastOverBowlerId: undefined
            };

            state.currentInning = 1;
            state.matchOver = false;
            state.matchResult = undefined;
        },

        updateInningsPlayers: (state, action: PayloadAction<UpdateInningsPlayersPayload>) => {
            const { inningNumber, currentStrikerId, currentNonStrikerId, currentBowlerId } = action.payload;
            const innings = inningNumber === 1 ? state.innings1 : state.innings2;
            
            innings.currentStrikerId = currentStrikerId;
            innings.currentNonStrikerId = currentNonStrikerId;
            innings.currentBowlerId = currentBowlerId;
            
            // Also update team references
            const battingTeam = state[innings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
            const bowlingTeam = state[innings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
            
            battingTeam.currentStrikerId = currentStrikerId;
            battingTeam.currentNonStrikerId = currentNonStrikerId;
            bowlingTeam.currentBowlerId = currentBowlerId;
        }
    }
});

export const {
    setTeamName,
    setTossWinner,
    setTossChoice,
    setTotalOvers,
    initializeInnings, // Add this
    setCurrentStriker,
    setCurrentNonStriker,
    addPlayer,
    editPlayerName,
    scoreBall,
    incrementOvers,
    wicketFallen,
    swapBatsman,
    undoLastBall,
    setBowler,
    retireBatsman,
    addExtraRuns,
    endInnings,
    clearMatchResult,
    resetGame,
    setMatchResult,
    setMatchOver,
    updateInningsPlayers // Add this
} = scoreboardSlice.actions;

export default scoreboardSlice.reducer;