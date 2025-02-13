// matchSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Batter {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    out: boolean;
    previousBowler: string;
}

interface Bowler {
    name: string;
    overs: number;
    maiden: number;
    runs: number;
    wickets: number;
    economy: number;
}

interface MatchScoreState {
    battingTeam: string;
    bowlingTeam: string;
    score: number;
    wickets: number;
    oversBowled: number;   // e.g. 0.0, 1.3, etc. in decimal
    runRate: number;       // current run rate (CRR)
    strikerIndex: number;  // which batter is on strike
    nonStrikerIndex: number;
    batters: Batter[];
    bowler: Bowler;
    extras: number;
    // Additional fields as needed...
    currentBowlerIndex: number;
    availableBowlers: string[];
    bowlerChangeNeeded: boolean;
    previousBowler: string;
}

interface MatchState {
    // existing fields...
    hostTeam: string;
    visitorTeam: string;
    tossWinner: 'host' | 'visitor';
    batOrBowl: 'bat' | 'bowl';
    overs: string;

    // ADVANCED SETTINGS
    playersPerTeam: string;
    noBallReball: boolean;
    noBallRun: string;
    wideBallReball: boolean;
    wideBallRun: string;

    openingStriker: string;
    openingNonStriker: string;
    openingBowler: string;

    battingTeam: string;
    bowlingTeam: string;
    score: number;
    wickets: number;
    oversBowled: number;   // e.g. 0.0, 1.3, etc. in decimal
    runRate: number;       // current run rate (CRR)
    strikerIndex: number;  // which batter is on strike
    nonStrikerIndex: number;
    batters: Batter[];
    bowler: Bowler;
    extras: number;

    nextBatsmanIndex: number; // which index in "batters" is next to come in
    availableBowlers: string[]; // e.g. store a list of bowler names
    currentBowlerIndex: number;
    bowlerChangeNeeded: boolean;  // new
    previousBowler: string;
}

const initialState: MatchState = {
    // existing defaults...
    hostTeam: '',
    visitorTeam: '',
    tossWinner: 'host',
    batOrBowl: 'bat',
    overs: '16',

    // ADVANCED SETTINGS defaults
    playersPerTeam: '11',
    noBallReball: true,
    noBallRun: '1',
    wideBallReball: true,
    wideBallRun: '1',

    // 
    openingStriker: '',
    openingNonStriker: '',
    openingBowler: '',

    battingTeam: 'Team A',
    bowlingTeam: 'Team B',
    score: 0,
    wickets: 0,
    oversBowled: 0, // e.g., 1.4 overs means "1 complete over + 4 balls"
    runRate: 0,
    strikerIndex: 0,     // batter at index 0 is on strike
    nonStrikerIndex: 1,  // batter at index 1 is non‐striker
    batters: [
        { name: 'San', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, out: false, previousBowler: '' },
        { name: 'Pra', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, out: false, previousBowler: '' },
        // more batters can be added once the match starts
    ],
    bowler: {
        name: 'Adi',
        overs: 0,
        maiden: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
    },
    extras: 0,

    nextBatsmanIndex: 2,      // 0 & 1 might be the openers
    availableBowlers: ['Adi', 'Ram', 'Nic', 'Alex'], // example
    currentBowlerIndex: 0,
    bowlerChangeNeeded: false,
    previousBowler: '',
};

const matchSlice = createSlice({
    name: 'match',
    initialState,
    reducers: {
        // existing reducers...
        setHostTeam(state, action: PayloadAction<string>) {
            state.hostTeam = action.payload;
        },
        setVisitorTeam(state, action: PayloadAction<string>) {
            state.visitorTeam = action.payload;
        },
        setTossWinner(state, action: PayloadAction<'host' | 'visitor'>) {
            state.tossWinner = action.payload;
        },
        setBatOrBowl(state, action: PayloadAction<'bat' | 'bowl'>) {
            state.batOrBowl = action.payload;
        },
        setOvers(state, action: PayloadAction<string>) {
            state.overs = action.payload;
        },

        // ADVANCED SETTINGS reducers
        setPlayersPerTeam(state, action: PayloadAction<string>) {
            state.playersPerTeam = action.payload;
        },
        setNoBallReball(state, action: PayloadAction<boolean>) {
            state.noBallReball = action.payload;
        },
        setNoBallRun(state, action: PayloadAction<string>) {
            state.noBallRun = action.payload;
        },
        setWideBallReball(state, action: PayloadAction<boolean>) {
            state.wideBallReball = action.payload;
        },
        setWideBallRun(state, action: PayloadAction<string>) {
            state.wideBallRun = action.payload;
        },

        // 
        setOpeningStriker(state, action: PayloadAction<string>) {
            state.openingStriker = action.payload;
        },
        setOpeningNonStriker(state, action: PayloadAction<string>) {
            state.openingNonStriker = action.payload;
        },
        setOpeningBowler(state, action: PayloadAction<string>) {
            state.openingBowler = action.payload;
        },

        // Set teams if needed
        setTeams(state, action: PayloadAction<{ battingTeam: string; bowlingTeam: string }>) {
            state.battingTeam = action.payload.battingTeam;
            state.bowlingTeam = action.payload.bowlingTeam;
        },

        // Example: update runs from a ball
        addRuns(state, action: PayloadAction<number>) {
            const runs = action.payload;
            const striker = state.batters[state.strikerIndex];
            // increment striker's runs, balls
            striker.runs += runs;
            striker.balls += 1;
            // update 4s/6s if needed
            if (runs === 4) {
                striker.fours += 1;
            } else if (runs === 6) {
                striker.sixes += 1;
            }
            // update match total
            state.score += runs;
            // increment bowler runs
            state.bowler.runs += runs;
            // increment total ball count
            incrementBallCount(state);
        },

        // For a dot ball (0 runs)
        dotBall(state) {
            const striker = state.batters[state.strikerIndex];
            striker.balls += 1;
            incrementBallCount(state);
        },
        selectNewBowler(state, action: PayloadAction<string>) {
            const selectedBowler = action.payload;
            state.currentBowlerIndex = state.availableBowlers.findIndex(b => b === selectedBowler);
            // If not found, you can handle that. We'll assume it always exists.

            // Reset bowler stats for the new over
            state.bowler = {
                ...state.bowler,
                name: selectedBowler,
                overs: 0,
                runs: 0,
                wickets: 0,
                economy: 0,
            };

            // Bowler change complete
            state.bowlerChangeNeeded = false;
        },
        // Wicket
        recordWicket(state, action: PayloadAction<{ type: string }>) {
            // Mark striker out
            state.batters[state.strikerIndex].out = true;
            state.wickets += 1;
            // Bowler gets a wicket, etc.

            // ---- NEW CODE: bring new batsman in at striker’s index
            const newIndex = state.nextBatsmanIndex;
            if (newIndex < state.batters.length) {
                // Replace out batsman with a new one from the bench
                state.batters[state.strikerIndex] = {
                    name: state.batters[newIndex].name,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    strikeRate: 0,
                    out: false,
                    previousBowler: '',
                };
                // increment nextBatsmanIndex so the next time we have a wicket,
                // we bring the next player in.
                state.nextBatsmanIndex += 1;
                state.nextBatsmanIndex += 1;
            } else {
                // means no more batsmen left
                // you might want to end innings here
            }

            incrementBallCount(state);
        },

        // Swap striker
        swapBatsman(state) {
            const temp = state.strikerIndex;
            state.strikerIndex = state.nonStrikerIndex;
            state.nonStrikerIndex = temp;
        },

        // Mark retire
        retireBatsman(state) {
            state.batters[state.strikerIndex].out = true;
            // you'd bring in next batter from bench here...
        },

        // Add an extra run for wide/no‐ball, etc.
        addExtra(state, action: PayloadAction<number>) {
            const extras = action.payload;
            state.extras += extras;
            state.score += extras;
            state.bowler.runs += extras;
            // For a wide/no‐ball, you usually *don’t* increment the ball count,
            // but for a bye, you do. You can handle that logic here as you see fit.
        },

    },
});

// HELPER to increment ball count in fraction, recalc run rate
function incrementBallCount(state: MatchScoreState) {
    const oversInt = Math.floor(state.oversBowled);
    const ballsInThisOver = Math.round((state.oversBowled - oversInt) * 10);
    let newBalls = ballsInThisOver + 1;
    let newOvers = oversInt;

    if (newBalls >= 6) {
        newOvers += 1;
        newBalls = 0;

        // Instead of auto‐changing:
        state.bowlerChangeNeeded = true;
        state.previousBowler = state.bowler.name;
    }

    state.oversBowled = parseFloat(`${newOvers}.${newBalls}`);
    // Recalc run rate if needed
}

// Add a new helper for changing bowler
function changeBowler(state: MatchScoreState) {
    // pick next bowler
    let nextIndex = state.currentBowlerIndex + 1;
    // If you want to avoid consecutive overs by same bowler, 
    // you can skip back to nextIndex + 1 if nextIndex is same as current.
    if (nextIndex >= state.availableBowlers.length) {
        // loop back or handle your own logic
        nextIndex = 0;
    }
    state.currentBowlerIndex = nextIndex;

    // Also update "bowler" object so UI shows new bowler’s name
    const nextBowlerName = state.availableBowlers[nextIndex];
    state.bowler = {
        ...state.bowler,
        name: nextBowlerName,
        overs: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
    };
}

export const {
    // existing exports...
    setHostTeam,
    setVisitorTeam,
    setTossWinner,
    setBatOrBowl,
    setOvers,

    // new advanced exports
    setPlayersPerTeam,
    setNoBallReball,
    setNoBallRun,
    setWideBallReball,
    setWideBallRun,
    // 
    setOpeningStriker,
    setOpeningNonStriker,
    setOpeningBowler,

    setTeams,
    addRuns,
    dotBall,
    recordWicket,
    swapBatsman,
    retireBatsman,
    addExtra,
    selectNewBowler
} = matchSlice.actions;

export default matchSlice.reducer;