import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { 
    ScoreboardState, 
    Team, 
    Innings, 
    ExtendedTeam,
    Cricketer 
} from '@/types';

const createInitialPlayer = (name: string): Cricketer => ({
    id: uuidv4(),
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
    isOut: false,
    overs: 0,
    ballsThisOver: 0,
    runsConceded: 0,
    wickets: 0,
    economy: 0,
    maidens: 0,
    catches: 0,
    runouts: 0
});

export const initialTeamState: Team = {
    id: '',
    name: '',
    players: [],
    currentStrikerId: null,
    currentNonStrikerId: null,
    currentBowlerId: null,
    lastOverBowlerId: null
};

const createInitialInnings = (): Innings => ({
    battingTeamId: '',
    bowlingTeamId: '',
    totalRuns: 0,
    wickets: 0,
    extras: 0,
    completedOvers: 0,
    ballInCurrentOver: 0,
    currentStrikerId: null,
    currentNonStrikerId: null,
    currentBowlerId: null,
    lastOverBowlerId: null,
    deliveries: []
});

export const initialState: ScoreboardState = {
    id: uuidv4(),
    teamA: { ...initialTeamState, id: uuidv4() },
    teamB: { ...initialTeamState, id: uuidv4() },
    currentInning: 1,
    innings1: createInitialInnings(),
    innings2: createInitialInnings(),
    tossWinner: 'teamA',
    tossChoice: 'bat',
    totalOvers: 20,
    matchOver: false,
    matchResult: null,
    targetScore: null
};