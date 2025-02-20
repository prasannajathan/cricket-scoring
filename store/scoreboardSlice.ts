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

const initialState: ExtendedScoreboardState & {
    matchOver: boolean;
    matchResult?: string;
    deliveryHistorySnapshots?: ScoreboardSnapshot[];
} = {
    id: uuidv4() + '_match',
    teamA: {
        ...initialTeamState,
        teamName: 'Team A',
    },
    teamB: {
        ...initialTeamState,
        teamName: 'Team B',
    },
    tossWinner: 'teamA',
    tossChoice: 'bat',
    totalOvers: 1,
    currentInning: 1,
    targetScore: undefined,
    totalPlayers: 11,
    deliveryHistory: [],
    matchResult: undefined,
    matchOver: false,
    deliveryHistorySnapshots: [],
    deliveriesInning1: [],
    deliveriesInning2: [],
};

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
            if (!state.tossWinner) return;

            if (state.tossWinner === 'teamA') {
                if (action.payload === 'bat') {
                    state.teamA.batting = true;
                    state.teamB.bowling = true;
                } else {
                    state.teamA.bowling = true;
                    state.teamB.batting = true;
                }
            } else {
                if (action.payload === 'bat') {
                    state.teamB.batting = true;
                    state.teamA.bowling = true;
                } else {
                    state.teamB.bowling = true;
                    state.teamA.batting = true;
                }
            }
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
            // 1. Snapshots for Undo
            const snapshot = JSON.parse(JSON.stringify(state));
            state.deliveryHistorySnapshots?.push(snapshot);

            if (state.matchOver) return;

            // 2. Decide who is batting/bowling
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            const bowlingTeam = state.teamA.batting ? state.teamB : state.teamA;

            // 3. Bowler constraint
            if (bowlingTeam.currentBowlerId && bowlingTeam.lastOverBowlerId === bowlingTeam.currentBowlerId) {
                throw new Error('Same bowler cannot bowl consecutive overs!');
            }

            // 4. Tally runs, extras
            const { runs, extraType, wicket, outBatsmanId, wicketType } = action.payload;
            let totalRuns = runs;
            let legalDelivery = true;
            if (extraType === 'wide' || extraType === 'no-ball') {
                totalRuns += 1;
                battingTeam.extras += 1;
                legalDelivery = false;
            } else if (extraType === 'bye' || extraType === 'leg-bye') {
                battingTeam.extras += runs;
            }
            battingTeam.totalRuns += totalRuns;

            // 5. Over/Ball counting
            if (legalDelivery) {
                battingTeam.ballInCurrentOver += 1;
                if (battingTeam.ballInCurrentOver >= 6) {
                    battingTeam.completedOvers += 1;
                    battingTeam.ballInCurrentOver = 0;
                    bowlingTeam.lastOverBowlerId = bowlingTeam.currentBowlerId;

                    // Swap strike at over’s end
                    const tmp = battingTeam.currentStrikerId;
                    battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
                    battingTeam.currentNonStrikerId = tmp;
                }
            }

            // 6. Batsman stats
            const striker = battingTeam.players.find((p) => p.id === battingTeam.currentStrikerId);
            if (striker) {
                if (legalDelivery) {
                    striker.balls += 1;
                }
                if (!extraType || extraType === 'no-ball') {
                    striker.runs += runs;
                    if (runs === 4) striker.fours += 1;
                    if (runs === 6) striker.sixes += 1;
                    striker.strikeRate = striker.balls
                        ? parseFloat(((striker.runs / striker.balls) * 100).toFixed(2))
                        : 0;
                }
            }

            // 7. Wicket
            if (wicket && legalDelivery) {
                battingTeam.wickets += 1;
                if (outBatsmanId) {
                    const outBatsman = battingTeam.players.find((pl) => pl.id === outBatsmanId);
                    if (outBatsman) outBatsman.isOut = true;
                }
                // End partnership
                if (battingTeam.activePartnership) {
                    battingTeam.activePartnership.endOver = battingTeam.completedOvers;
                    battingTeam.partnerships.push(battingTeam.activePartnership.runs);
                    battingTeam.activePartnership = null;
                }
            }

            // 8. Bowler stats
            const bowler = bowlingTeam.players.find((p) => p.id === bowlingTeam.currentBowlerId);
            if (bowler) {
                bowler.runsConceded += totalRuns;
                if (wicket && legalDelivery) bowler.wickets += 1;

                if (legalDelivery) {
                    bowler.ballsThisOver += 1;
                    if (bowler.ballsThisOver >= 6) {
                        bowler.overs += 1;
                        bowler.ballsThisOver = 0;
                    }
                }
                const totalBowledOvers = bowler.overs + bowler.ballsThisOver / 6;
                bowler.economy = totalBowledOvers
                    ? parseFloat((bowler.runsConceded / totalBowledOvers).toFixed(2))
                    : 0;
            }

            // 9. Partnership
            if (!battingTeam.activePartnership) {
                const p1 = battingTeam.currentStrikerId;
                const p2 = battingTeam.currentNonStrikerId;
                battingTeam.activePartnership = {
                    runs: 0,
                    batsman1Id: p1 || '',
                    batsman2Id: p2 || '',
                    startOver: battingTeam.completedOvers,
                    ballsFaced: 0,
                };
            }
            if (!extraType || extraType === 'no-ball') {
                battingTeam.activePartnership.runs += runs;
                battingTeam.activePartnership.ballsFaced! += 1;
            }

            // 10. Strike rotation on odd run
            const isOffBat = !extraType || extraType === 'no-ball';
            if (legalDelivery && runs % 2 === 1 && isOffBat) {
                const tmp = battingTeam.currentStrikerId;
                battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
                battingTeam.currentNonStrikerId = tmp;
            }

            // 11. Check chase
            if (state.currentInning === 2 && state.targetScore && !state.matchOver) {
                if (battingTeam.totalRuns >= state.targetScore) {
                    state.matchResult = `${battingTeam.teamName} wins by ${10 - battingTeam.wickets} wickets`;
                    state.matchOver = true;
                }
            }

            // 12. Record the delivery
            const deliveryRecord: DeliveryEvent = {
                runs: totalRuns,
                batsmanRuns: runs,
                extraType,
                wicket,
                outBatsmanId,
                wicketType,
            };
            if (state.currentInning === 1) {
                state.deliveriesInning1.push(deliveryRecord);
            } else {
                state.deliveriesInning2.push(deliveryRecord);
            }
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
            const { team, bowlerId } = action.payload;
            const t = state[team];

            if (t.lastOverBowlerId === bowlerId) {
                throw new Error('This bowler cannot bowl consecutive overs');
            }
            const bowler = t.players.find((p) => p.id === bowlerId);
            if (!bowler) throw new Error('Bowler not found');
            const maxOversAllowed = state.totalOvers === 20 ? 4 : 10;
            if (bowler.overs >= maxOversAllowed) {
                throw new Error('This bowler has already bowled the maximum overs allowed');
            }
            t.currentBowlerId = bowlerId;
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
            if (state.matchOver) return;

            if (state.currentInning === 1) {
                // Switch to second innings
                state.currentInning = 2;
                const firstInningsTeam = state.teamA.batting ? state.teamA : state.teamB;
                const firstInningsRuns = firstInningsTeam.totalRuns;
                state.targetScore = firstInningsRuns + 1;

                // Switch roles
                firstInningsTeam.batting = false;
                firstInningsTeam.bowling = false;
                const secondInningsTeam = firstInningsTeam === state.teamA ? state.teamB : state.teamA;
                secondInningsTeam.batting = true;
                secondInningsTeam.bowling = false;

                // Reset second innings scoreboard
                secondInningsTeam.totalRuns = 0;
                secondInningsTeam.wickets = 0;
                secondInningsTeam.completedOvers = 0;
                secondInningsTeam.ballInCurrentOver = 0;
                secondInningsTeam.activePartnership = null;
                secondInningsTeam.partnerships = [];
                state.deliveriesInning2 = [];
            } else {
                // End the match
                state.matchOver = true;
                if (!state.matchResult) {
                    const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
                    const otherTeam = battingTeam === state.teamA ? state.teamB : state.teamA;
                    if (state.targetScore && battingTeam.totalRuns >= state.targetScore) {
                        state.matchResult = `${battingTeam.teamName} wins by ${
                            10 - battingTeam.wickets
                        } wickets`;
                    } else {
                        if (state.targetScore && battingTeam.totalRuns === state.targetScore - 1) {
                            state.matchResult = 'Tie or super over scenario';
                        } else {
                            state.matchResult = `${otherTeam.teamName} wins!`;
                        }
                    }
                }
            }
        },

        resetGame: () => initialState,
    },
});

export const {
    setTeamName,
    setTossWinner,
    setTossChoice,
    setTotalOvers,
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
    resetGame,
} = scoreboardSlice.actions;

export default scoreboardSlice.reducer;