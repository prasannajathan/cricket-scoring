// store/cricket/initialState.ts
import 'react-native-get-random-values';
import { MatchState, Innings } from '@/types/match';
import { v4 as uuidv4 } from 'uuid';

export const createInitialInnings = (): Innings => ({
  id: uuidv4(),
  battingTeamId: '',
  bowlingTeamId: '',
  completedOvers: 0,
  ballInCurrentOver: 0,
  currentBowlerId: null,
  currentStrikerId: null,
  currentNonStrikerId: null,
  deliveries: [],
  extras: {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0
  },
  partnerships: [],
  isCompleted: false,
  totalRuns: 0,
  wickets: 0
});

export const initialState: MatchState = {
  matchDetails: {
    tossWinner: '',
    tossChoice: 'bat',
    totalOvers: 20,
    totalPlayers: 11,
    matchOver: false,
    matchResult: null,
    targetScore: null
  },
  teams: [
    {
      id: uuidv4(),
      teamName: 'Team A',
      players: [],
      isBatting: false,
      isBowling: false
    },
    {
      id: uuidv4(),
      teamName: 'Team B',
      players: [],
      isBatting: false,
      isBowling: false
    }
  ],
  innings: [createInitialInnings()]
};