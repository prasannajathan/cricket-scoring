// types/match.ts
export interface MatchDetails {
  tossWinner: TeamId;
  tossChoice: 'bat' | 'bowl';
  totalOvers: number;
  totalPlayers: number;
  matchOver: boolean;
  matchResult: string | null;
  targetScore: number | null;
}

export interface Team {
  id: TeamId;
  teamName: string;
  players: Player[];
  isBatting: boolean;
  isBowling: boolean;
}

export interface Player {
  id: PlayerId;
  playerName: string;
  role: PlayerRole;
  statistics: PlayerStatistics;
  isWicketKeeper?: boolean;
  captain?: boolean;
}

export interface PlayerStatistics {
  batting: BattingStats;
  bowling: BowlingStats;
  fielding: FieldingStats;
}

export interface BattingStats {
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissalInfo: DismissalInfo | null;
  strikeRate: number;
}

export interface BowlingStats {
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  ballsInOver: number;
}
export interface FieldingStats {
    catches: number;
    runOuts: number;
}

export interface Innings {
  id: string;
  ballInCurrentOver: number;
  battingTeamId: TeamId;
  bowlingTeamId: TeamId;
  completedOvers: number;
  currentBowlerId: PlayerId | null;
  currentNonStrikerId: PlayerId | null;
  currentStrikerId: PlayerId | null;
  deliveries: Delivery[];
  extras: ExtrasCount;
  isCompleted: boolean;
  partnerships: Partnership[];
  totalRuns: number;
  wickets: number;
}

export interface Delivery {
  deliveryNumber: string; // "1.1"
  runs: number;
  extrasType: ExtrasType | null;
  wicket: DismissalInfo | null;
  batsmanId: PlayerId;
  bowlerId: PlayerId;
  timestamp: number;
}

export interface Partnership {
  batsman1Id: PlayerId;
  batsman2Id: PlayerId;
  runs: number;
  balls: number;
  startTime?: number;
  endTime?: number;
}

export interface ExtrasCount {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
}

export interface DismissalInfo {
  type: DismissalType;
  dismissedPlayerId: PlayerId;
  bowlerId?: PlayerId;
  fielderId?: PlayerId;
}

export type TeamId = string;
export type PlayerId = string;
export type PlayerRole = 'batsman' | 'bowler' | 'allRounder';
export type DismissalType = 'bowled' | 'caught' | 'lbw' | 'runOut' | 'stumped' | 'hitWicket' | 'retiredHurt';
export type ExtrasType = 'wide' | 'noBall' | 'bye' | 'legBye';

// Initial state structure
export interface MatchState {
  matchDetails: MatchDetails;
  teams: Team[];
  innings: Innings[];
}