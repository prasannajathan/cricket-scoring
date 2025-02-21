import { DeliveryDetails, PowerPlay, BatsmanStats, BowlerStats } from '@/store/cricket/types/scoring';
import { BALLS_PER_OVER } from '@/constants/scoring';
import { isPowerPlayOver } from '@/utils/powerPlay';

interface Partnership {
    runs: number;
    balls: number;
    startIndex: number;
    endIndex: number;
}

const calculatePowerPlayScore = (
    deliveries: DeliveryDetails[], 
    powerPlays: PowerPlay[]
): number => {
    return deliveries.reduce((total, delivery, index) => {
        const overNumber = Math.floor(index / BALLS_PER_OVER);
        if (isPowerPlayOver(overNumber, powerPlays)) {
            return total + delivery.runs;
        }
        return total;
    }, 0);
};

const calculatePartnershipStats = (deliveries: DeliveryDetails[]): { 
    highest: number; 
    average: number; 
} => {
    const partnerships: Partnership[] = [];
    let currentPartnership: Partnership = {
        runs: 0,
        balls: 0,
        startIndex: 0,
        endIndex: 0
    };

    deliveries.forEach((delivery, index) => {
        currentPartnership.runs += delivery.runs;
        currentPartnership.balls += 1;

        if (delivery.wicket) {
            currentPartnership.endIndex = index;
            partnerships.push({ ...currentPartnership });
            currentPartnership = {
                runs: 0,
                balls: 0,
                startIndex: index + 1,
                endIndex: 0
            };
        }
    });

    // Add last partnership if not ended with wicket
    if (currentPartnership.runs > 0) {
        currentPartnership.endIndex = deliveries.length - 1;
        partnerships.push(currentPartnership);
    }

    const highest = Math.max(...partnerships.map(p => p.runs), 0);
    const average = partnerships.length > 0 
        ? partnerships.reduce((sum, p) => sum + p.runs, 0) / partnerships.length 
        : 0;

    return {
        highest,
        average: Number(average.toFixed(2))
    };
};

export interface MatchSummary {
    totalRuns: number;
    wickets: number;
    runRate: number;
    extras: number;
    boundaries: {
        fours: number;
        sixes: number;
    };
    partnerships: {
        highest: number;
        average: number;
    };
    powerPlayScore: number;
    dotBallPercentage: number;
}

export const calculateMatchSummary = (
    deliveries: DeliveryDetails[],
    powerPlays: PowerPlay[]
): MatchSummary => {
    const summary = deliveries.reduce((acc, delivery) => {
        const runs = delivery.runs;
        const isExtra = !!delivery.extraType;
        
        return {
            totalRuns: acc.totalRuns + runs,
            wickets: acc.wickets + (delivery.wicket ? 1 : 0),
            extras: acc.extras + (isExtra ? runs : 0),
            boundaries: {
                fours: acc.boundaries.fours + (runs === 4 ? 1 : 0),
                sixes: acc.boundaries.sixes + (runs === 6 ? 1 : 0)
            },
            dotBalls: acc.dotBalls + (runs === 0 && !isExtra ? 1 : 0),
        };
    }, {
        totalRuns: 0,
        wickets: 0,
        extras: 0,
        boundaries: { fours: 0, sixes: 0 },
        dotBalls: 0
    });

    const overs = deliveries.length / BALLS_PER_OVER;
    
    return {
        ...summary,
        runRate: summary.totalRuns / overs,
        powerPlayScore: calculatePowerPlayScore(deliveries, powerPlays),
        dotBallPercentage: (summary.dotBalls / deliveries.length) * 100,
        partnerships: calculatePartnershipStats(deliveries)
    };
};