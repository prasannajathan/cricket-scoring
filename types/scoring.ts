import { wicketTypes } from '@/constants/scoring';

export type ExtraType = 'wide' | 'no-ball' | 'bye' | 'leg-bye';
export type WicketType = typeof wicketTypes[number]

export interface ScoringState {
    wide: boolean;
    noBall: boolean;
    bye: boolean;
    legBye: boolean;
    wicket: boolean;
    wicketType: WicketType;
    outBatsmanId?: string;
}

export interface BatsmanStats {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    isOut: boolean;
    isRetired: boolean;
    howOut?: WicketType;
    dismissedBy?: string;
}

export interface BowlerStats {
    overs: number;
    ballsThisOver: number;
    maidens: number;
    runsConceded: number;
    wickets: number;
    economy: number;
    dotBalls: number;
}

export interface PowerPlay {
    startOver: number;
    endOver: number;
}
export interface Partnership {
    player1Id: string;
    player2Id: string;
    runs: number;
    balls: number;
    isActive: boolean;
    startTime: number;
}

export interface ScoringOptions {
    canUndo: boolean;
    canSwap: boolean;
    canScore: boolean;
    canBowl: boolean;
    isOverComplete: boolean;
    isInningsComplete: boolean;
    isMatchComplete: boolean;
}

export interface DeliveryDetails {
    runs: number;
    extraType?: ExtraType;
    wicket: boolean;
    wicketType?: WicketType;
    outBatsmanId?: string;
    bowlerId: string;
    batsmanId: string;
    timestamp: number;
    overNumber: number;
    ballNumber: number;
}

export interface MatchState {
    currentInningsId: string;
    targetScore?: number;
    requiredRunRate?: number;
    currentRunRate: number;
    oversRemaining: number;
    battingTeamId: string;
    bowlingTeamId: string;
    currentPartnership: Partnership;
    lastDelivery?: DeliveryDetails;
}

export interface PlayerStats {
    id: string;
    name: string;
    matches: number;
    battingStats: {
        innings: number;
        runs: number;
        balls: number;
        highScore: number;
        average: number;
        strikeRate: number;
        fifties: number;
        hundreds: number;
        fours: number;
        sixes: number;
    };
    bowlingStats: {
        innings: number;
        overs: number;
        wickets: number;
        runsConceded: number;
        economy: number;
        average: number; 
        bestBowling: string; 
        fiveWickets: number;
    };
    fieldingStats: {
        catches: number;
        runouts: number;
        stumps: number; 
    };
}