// types/index.ts
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

    tossWinner: boolean;          // to know which team won the toss
    batting: boolean;
    bowling: boolean;

    completedOvers: number; // e.g. 4 overs complete
    ballInCurrentOver: number; // 0-5
    // overs: number;   // ---
    totalRuns: number;
    wickets: number;
    extras: number;
    deliveries: DeliveryEvent[];

    currentBowlerId?: string; // track current bowler
    currentStrikerId?: string;
    currentNonStrikerId?: string;
    openingStriker?: string;
    openingNonStriker?: string;
    openingBowler?: string;
    lastOverBowlerId?: string;

    currentPartnership: number;
    partnerships: number[];

    target?: number; // ---
    isDeclared?: boolean;
    isAllOut?: boolean;
    isCompleted?: boolean;
}

export interface ScoreboardState {
    id: string;
    teamA: Team;
    teamB: Team;

    tossWinner: 'teamA' | 'teamB' | null;
    tossChoice: 'bat' | 'bowl' | null;
    totalOvers: number;
    currentInning: 1 | 2;
    targetScore?: number;

    totalPlayers: number;
    deliveryHistory: DeliveryEvent[];
    matchResult?: string;
    matchOver: boolean;
    deliveriesInning1: DeliveryEvent[];
    deliveriesInning2: DeliveryEvent[];
}