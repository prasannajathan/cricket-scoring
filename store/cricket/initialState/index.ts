// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { ScoreboardState, ExtendedTeam } from '@/types';

export const initialTeamState: ExtendedTeam = {
    id: uuidv4(),
    teamName: '',
    players: [],
    isBatting: false,
    isBowling: false,
    tossWinner: false,
    currentBowlerId: undefined,
    currentStrikerId: undefined,
    currentNonStrikerId: undefined,
    lastOverBowlerId: undefined,
    wickets: 0,
    completedOvers: 0,
    totalRuns: 0,
    ballInCurrentOver: 0,
};

const createInitialInnings = () => ({
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
});

export const initialState: ScoreboardState = {
    id: uuidv4(),
    teamA: { ...initialTeamState, teamName: 'team A', id: uuidv4() },
    teamB: { ...initialTeamState, teamName: 'team B', id: uuidv4() },
    tossWinner: 'teamA',
    tossChoice: 'bat',
    totalOvers: 1,
    currentInning: 1,
    totalPlayers: 11,
    innings1: createInitialInnings(),
    innings2: createInitialInnings(),
    matchOver: false,
    matchResult: undefined,
    targetScore: undefined
};