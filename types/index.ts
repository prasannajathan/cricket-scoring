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
    fielderId?: string; 
}

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
    fielderId?: string;
}

export interface PartnershipRecord {
    runs: number;
    balls: number;
    player1Id: string;
    player2Id: string;
    isActive: boolean;
}
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
    readyForInnings2?: boolean;
    isAllOut?: boolean;
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
    isRetired?: boolean;
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
    wickets: number;
    completedOvers?: number;
    totalRuns?: number;
    ballInCurrentOver?: number;
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
    alertMessage?: string;
}