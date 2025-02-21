import { BatsmanStats, BowlerStats, Partnership, DeliveryDetails, ExtraType } from '@/store/cricket/types/scoring';
import { MATCH_RULES } from '@/constants/scoring';

export const calculateBatsmanStats = (deliveries: DeliveryDetails[], batsmanId: string): BatsmanStats => {
    return deliveries.reduce((stats, delivery) => {
        if (delivery.batsmanId !== batsmanId) return stats;
        
        const runs = delivery.extraType ? 0 : delivery.runs;
        return {
            ...stats,
            runs: stats.runs + runs,
            balls: stats.balls + (isLegalDelivery(delivery) ? 1 : 0),
            fours: runs === 4 ? stats.fours + 1 : stats.fours,
            sixes: runs === 6 ? stats.sixes + 1 : stats.sixes,
            strikeRate: calculateStrikeRate(stats.runs + runs, stats.balls + 1)
        };
    }, {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        isRetired: false
    });
};

export const calculateBowlerStats = (deliveries: DeliveryDetails[], bowlerId: string): BowlerStats => {
    return deliveries.reduce((stats, delivery) => {
        if (delivery.bowlerId !== bowlerId) return stats;
        
        const isLegal = isLegalDelivery(delivery);
        const isDot = isLegal && delivery.runs === 0;
        
        return {
            ...stats,
            overs: Math.floor((stats.ballsThisOver + (isLegal ? 1 : 0)) / MATCH_RULES.BALLS_PER_OVER),
            ballsThisOver: (stats.ballsThisOver + (isLegal ? 1 : 0)) % MATCH_RULES.BALLS_PER_OVER,
            runsConceded: stats.runsConceded + delivery.runs,
            wickets: stats.wickets + (delivery.wicket ? 1 : 0),
            dotBalls: isDot ? stats.dotBalls + 1 : stats.dotBalls,
            economy: calculateEconomy(
                stats.runsConceded + delivery.runs,
                stats.overs * MATCH_RULES.BALLS_PER_OVER + stats.ballsThisOver + (isLegal ? 1 : 0)
            )
        };
    }, {
        overs: 0,
        ballsThisOver: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
        dotBalls: 0
    });
};

export const calculatePartnership = (
    deliveries: DeliveryDetails[],
    player1Id: string,
    player2Id: string
): Partnership => {
    return deliveries.reduce((partnership, delivery) => {
        if (delivery.batsmanId !== player1Id && delivery.batsmanId !== player2Id) return partnership;
        
        return {
            ...partnership,
            runs: partnership.runs + (delivery.extraType ? 0 : delivery.runs),
            balls: partnership.balls + (isLegalDelivery(delivery) ? 1 : 0)
        };
    }, {
        player1Id,
        player2Id,
        runs: 0,
        balls: 0,
        isActive: true,
        startTime: Date.now()
    });
};

export const isLegalDelivery = (delivery: DeliveryDetails): boolean => {
    return !delivery.extraType || delivery.extraType === 'bye' || delivery.extraType === 'leg-bye';
};

export const calculateStrikeRate = (runs: number, balls: number): number => {
    return balls > 0 ? (runs / balls) * 100 : 0;
};

export const calculateEconomy = (runs: number, balls: number): number => {
    const overs = balls / MATCH_RULES.BALLS_PER_OVER;
    return overs > 0 ? runs / overs : 0;
};

export const calculateRequiredRunRate = (
    target: number,
    currentScore: number,
    totalOvers: number,
    currentOver: number,
    ballsInOver: number
): number => {
    const remainingRuns = target - currentScore;
    const remainingBalls = (totalOvers * MATCH_RULES.BALLS_PER_OVER) - 
                          (currentOver * MATCH_RULES.BALLS_PER_OVER + ballsInOver);
    const remainingOvers = remainingBalls / MATCH_RULES.BALLS_PER_OVER;
    
    return remainingOvers > 0 ? remainingRuns / remainingOvers : 99.99;
};

export const validateBowlerEligibility = (
    bowler: BowlerStats,
    lastOverBowlerId: string | undefined,
    bowlerId: string
): boolean => {
    return bowler.overs < MATCH_RULES.MAX_OVERS_PER_BOWLER && 
           lastOverBowlerId !== bowlerId;
};

export const getMatchProjection = (
    currentScore: number,
    completedOvers: number,
    ballsInOver: number,
    totalOvers: number
): { projectedScore: number; currentRunRate: number } => {
    const currentBalls = (completedOvers * MATCH_RULES.BALLS_PER_OVER) + ballsInOver;
    const totalBalls = totalOvers * MATCH_RULES.BALLS_PER_OVER;
    const currentRunRate = (currentScore / currentBalls) * MATCH_RULES.BALLS_PER_OVER;
    
    return {
        projectedScore: Math.round(currentRunRate * totalOvers),
        currentRunRate
    };
};

export const handleRetiredHurt = (
    deliveries: DeliveryDetails[],
    batsmanId: string,
    timestamp: number
): DeliveryDetails => ({
    runs: 0,
    wicket: true,
    wicketType: 'retired hurt',
    outBatsmanId: batsmanId,
    bowlerId: deliveries[deliveries.length - 1].bowlerId,
    batsmanId,
    timestamp,
    overNumber: Math.floor(deliveries.length / MATCH_RULES.BALLS_PER_OVER),
    ballNumber: deliveries.length % MATCH_RULES.BALLS_PER_OVER || MATCH_RULES.BALLS_PER_OVER
});

export const calculatePartnerships = (
    deliveries: DeliveryDetails[]
): Partnership[] => {
    const partnerships: Partnership[] = [];
    let currentPartnership: Partnership | null = null;

    deliveries.forEach(delivery => {
        if (!currentPartnership) {
            currentPartnership = {
                player1Id: delivery.batsmanId,
                player2Id: '', // Will be set when second player arrives
                runs: delivery.extraType ? 0 : delivery.runs,
                balls: isLegalDelivery(delivery) ? 1 : 0,
                isActive: true,
                startTime: delivery.timestamp
            };
        } else if (currentPartnership.player2Id === '') {
            if (delivery.batsmanId !== currentPartnership.player1Id) {
                currentPartnership.player2Id = delivery.batsmanId;
            }
            currentPartnership.runs += delivery.extraType ? 0 : delivery.runs;
            currentPartnership.balls += isLegalDelivery(delivery) ? 1 : 0;
        } else if (delivery.wicket && delivery.outBatsmanId) {
            currentPartnership.isActive = false;
            partnerships.push(currentPartnership);
            currentPartnership = {
                player1Id: delivery.batsmanId === currentPartnership.player1Id ? 
                          currentPartnership.player2Id : currentPartnership.player1Id,
                player2Id: '',
                runs: 0,
                balls: 0,
                isActive: true,
                startTime: delivery.timestamp
            };
        } else {
            currentPartnership.runs += delivery.extraType ? 0 : delivery.runs;
            currentPartnership.balls += isLegalDelivery(delivery) ? 1 : 0;
        }
    });

    if (currentPartnership && currentPartnership.player2Id) {
        partnerships.push(currentPartnership);
    }

    return partnerships;
};

export const formatOvers = (overs: number, balls: number): string => {
    return `${overs}.${balls}`;
};

export const parseOvers = (oversString: string): { overs: number; balls: number } => {
    const [overs, balls] = oversString.split('.').map(Number);
    return { overs, balls: balls || 0 };
};