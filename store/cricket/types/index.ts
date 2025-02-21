export interface ExtendedTeam extends Team {
    activePartnership?: PartnershipRecord | null;
    lastOverBowlerId?: string;
}

export interface ExtendedScoreboardState extends Omit<ScoreboardState, 'teamA' | 'teamB'> {
    teamA: ExtendedTeam;
    teamB: ExtendedTeam;
}

export interface UpdateInningsPlayersPayload {
    inningNumber: 1 | 2;
    currentStrikerId: string;
    currentNonStrikerId: string;
    currentBowlerId: string;
}

export interface ScoreBallPayload {
    runs: number;
    extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    wicket?: boolean;
    wicketType?: string;
    outBatsmanId?: string;
}
// moved from @types/index
// export interface ScoreBallPayload {
//     runs: number;            // runs from that ball (not counting extras)
//     extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
//     wicket?: boolean;
//     boundary?: boolean;      // if the shot was a 4 or 6
//     outBatsmanId?: string;
//     wicketType?: 'bowled' | 'caught' | 'runout' | 'lbw' | 'stumped' | 'hitWicket' | 'retired' | 'other';
// }

export interface DeliveryEvent {
    runs: number;
    batsmanRuns: number;
    extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    wicket: boolean;
    wicketType?: string;
    outBatsmanId?: string;
    bowlerId: string;
    batsmanId: string;
    timestamp: number;
}
// moved from @types/index
// export interface DeliveryEvent {
//     runs: number;
//     batsmanRuns: number;
//     extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
//     wicket?: boolean;
//     outBatsmanId?: string;
//     wicketType?: 'bowled' | 'caught' | 'runout' | 'lbw' | 'stumped' | 'hitWicket' | 'retired' | 'other';
// }

export interface PartnershipRecord {
    runs: number;
    balls: number;
    player1Id: string;
    player2Id: string;
    isActive: boolean;
}
// moved from @types/index
// export interface PartnershipRecord {
//     runs: number;
//     batsman1Id: string;
//     batsman2Id: string;
//     startOver: number;
//     endOver?: number;
//     ballsFaced?: number;
// }

export interface InningsData {
    id: string;
    battingTeamId: string;
    bowlingTeamId: string;
    totalRuns: number;
    wickets: number;
    completedOvers: number;
    ballInCurrentOver: number;
    extras: number;
    currentBowlerId?: string;
    currentStrikerId?: string;
    currentNonStrikerId?: string;
    lastOverBowlerId?: string;
    partnerships: PartnershipRecord[];
    deliveries: DeliveryEvent[];
    isCompleted: boolean;
}

export interface SavedMatch {
    id: string;
    name: string;
    completed: boolean;
    timestamp: number;
    teamA: Team;
    teamB: Team;
    innings1: InningsData;
    innings2: InningsData;
    matchResult?: string;
}

// moved from @types/index
export interface Cricketer {
    // Batting fields
    id: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    isOut: boolean;
    isWicketKeeper?: boolean;

    // Bowling fields
    overs: number;
    ballsThisOver: number;
    runsConceded: number;
    wickets: number;
    economy: number;
    maidens: number;

    // Fielding fields
    catches: number;
    runouts: number;

    // Team fields
    captain?: boolean;
}
export interface Team {
    id: string;
    teamName: string;
    players: Cricketer[];
    isBatting: boolean;
    isBowling: boolean;
    tossWinner: boolean;
    currentBowlerId?: string;
    currentStrikerId?: string;
    currentNonStrikerId?: string;
    lastOverBowlerId?: string;
}

export interface ScoreboardState {
    id: string;
    teamA: Team;
    teamB: Team;
    tossWinner: 'teamA' | 'teamB';
    tossChoice: 'bat' | 'bowl';
    totalOvers: number;
    currentInning: 1 | 2;
    targetScore?: number;
    totalPlayers: number;
    innings1: InningsData;
    innings2: InningsData;
    matchResult?: string;
    matchOver: boolean;
}