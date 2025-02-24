import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { DeliveryDetails } from '@/types/scoring';

import { BALLS_PER_OVER } from '@/constants/scoring';

export interface WicketFall {
    score: number;
    overs: string;
    wicketNumber: number;
    batsmanId: string;
    wicketType: string;
    bowlerId: string;
    partnership: {
        runs: number;
        balls: number;
    };
}

export const trackFallOfWickets = (deliveries: DeliveryDetails[]): WicketFall[] => {
    
    const fowList: WicketFall[] = [];
    let currentScore = 0;
    let partnershipRuns = 0;
    let partnershipBalls = 0;

    deliveries.forEach(delivery => {
        const isLegal = !delivery.extraType || 
                       delivery.extraType === 'bye' || 
                       delivery.extraType === 'leg-bye';
        
        currentScore += delivery.runs;
        partnershipRuns += delivery.runs;
        if (isLegal) partnershipBalls++;

        if (delivery.wicket && delivery.outBatsmanId) {
            const overs = Math.floor(deliveries.length / BALLS_PER_OVER);
            const balls = deliveries.length % BALLS_PER_OVER;

            fowList.push({
                score: currentScore,
                overs: `${overs}.${balls}`,
                wicketNumber: fowList.length + 1,
                batsmanId: delivery.outBatsmanId,
                wicketType: delivery.wicketType || 'unknown',
                bowlerId: delivery.bowlerId,
                partnership: {
                    runs: partnershipRuns,
                    balls: partnershipBalls
                }
            });

            // Reset partnership stats
            partnershipRuns = 0;
            partnershipBalls = 0;
        }
    });

    return fowList;
};