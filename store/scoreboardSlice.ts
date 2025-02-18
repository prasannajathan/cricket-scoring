// store/scoreboardSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Team, ScoreboardState, Cricketer, ScoreBallPayload, DeliveryEvent, PartnershipRecord } from '@/types';

interface ExtendedTeam extends Team {
    activePartnership?: PartnershipRecord | null;
    lastOverBowlerId?: string;
}
interface ExtendedScoreboardState extends Omit<ScoreboardState, 'teamA' | 'teamB'> {
    teamA: ExtendedTeam;
    teamB: ExtendedTeam;
}

// --- Initial State ---
const initialTeamState: ExtendedTeam = {
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

interface ScoreboardSnapshot extends ScoreboardState { }

const initialState: ExtendedScoreboardState & {
    matchOver: boolean;
    matchResult?: string;
    // For a full undo system:
    deliveryHistorySnapshots?: ScoreboardSnapshot[];
} = {
    teamA: {
        // Host Team
        ...initialTeamState,
        teamName: 'Team A',
    },
    teamB: {
        // Visitor Team
        ...initialTeamState,
        teamName: 'Team B',
    },
    tossWinner: 'teamA', // null
    tossChoice: 'bat', // null
    totalOvers: 1, // 20
    currentInning: 1,
    targetScore: undefined,

    totalPlayers: 11,
    deliveryHistory: [],
    matchResult: undefined,
    matchOver: false,

    deliveryHistorySnapshots: [],
};

export const scoreboardSlice = createSlice({
    name: 'scoreboard',
    initialState,
    reducers: {
        // ------------ NEW MATCH SCREEN ------------
        // NewMatchScreen
        setTeamName: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; name: string }>
        ) => {
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
                // teamB won toss
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
        // OpeningPlayersScreen
        setCurrentStriker: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string }>) => {
            state[action.payload.team].currentStrikerId = action.payload.playerId;
        },
        setCurrentNonStriker: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; playerId: string }>) => {
            state[action.payload.team].currentNonStrikerId = action.payload.playerId;
        },
        // --------------- ADD / EDIT PLAYERS ---------------
        // Scoring
        addPlayer: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; player: Cricketer }>
        ) => {
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
        // Main scoring action
        scoreBall: (state, action: PayloadAction<ScoreBallPayload>) => {
            // 0) Create a deep snapshot for a robust undo
            const snapshot = JSON.parse(JSON.stringify(state));
            state.deliveryHistorySnapshots.push(snapshot);

            if (state.matchOver) return;

            const battingTeam = state.teamA.batting ? state.teamA : state.teamB as ExtendedTeam;
            const bowlingTeam = state.teamA.batting ? state.teamB : state.teamA as ExtendedTeam;

            // Bowler constraint: if bowler is same as lastOverBowlerId, error
            if (bowlingTeam.currentBowlerId && bowlingTeam.lastOverBowlerId === bowlingTeam.currentBowlerId) {
                // In real code, you might handle it gracefully instead of throw
                throw new Error('Same bowler cannot bowl consecutive overs!');
            }

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

            // 2. Over / Ball counting
            // Over counting & switch strike after over
            if (legalDelivery) {
                battingTeam.ballInCurrentOver += 1;
                if (battingTeam.ballInCurrentOver >= 6) {
                    battingTeam.completedOvers += 1;
                    battingTeam.ballInCurrentOver = 0;
                    // store who bowled that over
                    bowlingTeam.lastOverBowlerId = bowlingTeam.currentBowlerId;

                    // switch strike for new over
                    const tmp = battingTeam.currentStrikerId;
                    battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
                    battingTeam.currentNonStrikerId = tmp;
                }
            }

            // 3. Batsman stats
            const striker = battingTeam.players.find(
                (p) => p.id === battingTeam.currentStrikerId
            );
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

            // 4. Wicket logic
            // Wicket
            if (wicket && legalDelivery) {
                battingTeam.wickets += 1;
                if (outBatsmanId) {
                    const outBatsman = battingTeam.players.find((pl) => pl.id === outBatsmanId);
                    if (outBatsman) outBatsman.isOut = true;
                } else {
                    // assume striker if not specified
                }
                // finalize current partnership
                battingTeam.activePartnership!.endOver = battingTeam.completedOvers;
                battingTeam.partnerships.push(battingTeam.activePartnership!.runs);
                // or push a full object if you want
                battingTeam.activePartnership = null;
            }

            // 5. Bowler stats
            const bowler = bowlingTeam.players.find(
                (p) => p.id === bowlingTeam.currentBowlerId
            );
            // add runs to bowler's runsConceded, not bowler.runs
            if (bowler) {
                bowler.runsConceded += totalRuns;
                if (wicket && legalDelivery) bowler.wickets += 1;

                if (legalDelivery) {
                    bowler.ballsThisOver += 1;
                    if (bowler.ballsThisOver >= 6) {
                        bowler.overs += 1;
                        bowler.ballsThisOver = 0;
                        // check if that was a maiden, etc.
                    }
                }
                // economy = total runs / total overs for the bowler
                const totalBowledOvers = bowler.overs + bowler.ballsThisOver / 6;
                bowler.economy = totalBowledOvers
                    ? parseFloat((bowler.runsConceded / totalBowledOvers).toFixed(2))
                    : 0;
            }

            // 6. Partnership
            if (!battingTeam.activePartnership) {
                // start new if needed
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
                battingTeam.activePartnership!.runs += runs;
                battingTeam.activePartnership!.ballsFaced += 1;
            }

            // 7. Strike Rotation on odd run
            const isOffBat = !extraType || extraType === 'no-ball';
            if (legalDelivery && runs % 2 === 1 && isOffBat) {
                // swap
                const tmp = battingTeam.currentStrikerId;
                battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
                battingTeam.currentNonStrikerId = tmp;
            }

            // 8. Check if second innings chase is complete
            if (state.currentInning === 2 && state.targetScore && !state.matchOver) {
                // if battingTeam surpasses the target
                if (battingTeam.totalRuns >= state.targetScore) {
                    state.matchResult = `${battingTeam.teamName} wins by ${10 - battingTeam.wickets
                        } wickets`;
                    state.matchOver = true;
                }
                // else if overs are up or 10 wickets, you might finalize the result.
            }

            // 9. Save to delivery history
            const deliveryRecord: DeliveryEvent = {
                runs: totalRuns,
                batsmanRuns: runs,
                extraType,
                wicket,
                outBatsmanId,
                wicketType,
            };
            battingTeam.deliveries.push(deliveryRecord);
            state.deliveryHistory.push(deliveryRecord);
        },

        // Over increment (if needed externally)
        incrementOvers: (state) => {
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            battingTeam.completedOvers += 1;
            battingTeam.ballInCurrentOver = 0;
        },

        // Wicket fallen
        wicketFallen: (state) => {
            // minimal example
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            battingTeam.wickets += 1;
        },

        // Manually swap batsman
        swapBatsman: (state) => {
            const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
            const tmp = battingTeam.currentStrikerId;
            battingTeam.currentStrikerId = battingTeam.currentNonStrikerId;
            battingTeam.currentNonStrikerId = tmp;
        },

        // Undo
        undoLastBall: (state) => {
            if (!state.deliveryHistorySnapshots.length) return;
            const prev = state.deliveryHistorySnapshots.pop();
            if (prev) {
                // Possibly remove or reset the snapshots on 'prev' to avoid recursion:
                prev.deliveryHistorySnapshots = [];
                return prev as typeof state;
            }
        },

        setBowler: (state, action: PayloadAction<{ team: 'teamA' | 'teamB'; bowlerId: string }>) => {
            const { team, bowlerId } = action.payload;
            const t = state[team] as ExtendedTeam;

            // 1. No consecutive overs:
            if (t.lastOverBowlerId === bowlerId) {
                throw new Error('This bowler cannot bowl consecutive overs');
            }

            // 2. Max overs per bowler (for T20 = 4, for ODI = 10, etc.)
            const bowler = t.players.find((p) => p.id === bowlerId);
            if (!bowler) throw new Error('Bowler not found');
            const maxOversAllowed = (state.totalOvers === 20) ? 4 : 10; // example
            if (bowler.overs >= maxOversAllowed) {
                throw new Error('This bowler has already bowled the maximum overs allowed');
            }

            // If checks pass, set him as currentBowler
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
            // push partnership, reset
            t.partnerships.push(t.currentPartnership);
            t.currentPartnership = 0;
        },

        addExtraRuns: (
            state,
            action: PayloadAction<{ team: 'teamA' | 'teamB'; runs: number }>
        ) => {
            const { team, runs } = action.payload;
            state[team].extras += runs;
            state[team].totalRuns += runs;
        },

        // End first or second innings
        endInnings: (state) => {
            if (state.matchOver) return; // do nothing if match is over

            if (state.currentInning === 1) {
                // first innings done => go to second
                state.currentInning = 2;
                // set target
                const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
                const firstInningsRuns = battingTeam.totalRuns;
                state.targetScore = firstInningsRuns + 1;

                // Switch roles
                battingTeam.batting = false;
                battingTeam.bowling = false;
                const otherTeam = battingTeam === state.teamA ? state.teamB : state.teamA;
                otherTeam.batting = true;
                otherTeam.bowling = false;
            } else {
                // second innings ends => match is over
                state.matchOver = true;

                // Decide final result if not already set
                if (!state.matchResult) {
                    const battingTeam = state.teamA.batting ? state.teamA : state.teamB;
                    const otherTeam = battingTeam === state.teamA ? state.teamB : state.teamA;

                    if (state.targetScore && battingTeam.totalRuns >= state.targetScore) {
                        state.matchResult = `${battingTeam.teamName} wins by ${10 - battingTeam.wickets
                            } wickets`;
                    } else {
                        // fielding side wins or tie
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