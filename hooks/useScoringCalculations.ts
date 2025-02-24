import { useMemo } from 'react';
import { DeliveryDetails } from '@/types/scoring';
import { calculatePartnershipStats } from '@/utils/matchStats';

export const useScoringCalculations = (deliveries: DeliveryDetails[]) => {
    const currentRunRate = useMemo(() => {
        if (!deliveries.length) return 0;
        const totalRuns = deliveries.reduce((sum, d) => sum + d.runs, 0);
        const overs = deliveries.length / 6;
        return Number((totalRuns / overs).toFixed(2));
    }, [deliveries]);

    const partnerships = useMemo(() => 
        calculatePartnershipStats(deliveries), 
    [deliveries]);

    return { currentRunRate, partnerships };
};