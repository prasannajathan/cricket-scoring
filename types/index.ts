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

export interface DeliveryEvent {
    runs: number;
    batsmanRuns: number;
    extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    wicket?: boolean;
    outBatsmanId?: string;
    wicketType?: 'bowled' | 'caught' | 'runout' | 'lbw' | 'stumped' | 'hitWicket' | 'retired' | 'other';
}

export interface ScoreBallPayload {
    runs: number;            // runs from that ball (not counting extras)
    extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    wicket?: boolean;
    boundary?: boolean;      // if the shot was a 4 or 6
    outBatsmanId?: string;
    wicketType?: 'bowled' | 'caught' | 'runout' | 'lbw' | 'stumped' | 'hitWicket' | 'retired' | 'other';
}

export interface PartnershipRecord {
    runs: number;
    batsman1Id: string;
    batsman2Id: string;
    startOver: number;
    endOver?: number;
    ballsFaced?: number;
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

export interface InningsData {
    id: string;
    battingTeamId: string;
    bowlingTeamId: string;
    totalRuns: number;
    wickets: number;
    completedOvers: number;
    ballInCurrentOver: number;
    extras: number;
    partnerships: PartnershipRecord[];
    deliveries: DeliveryEvent[];
    isCompleted: boolean;
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