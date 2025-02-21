import { DeliveryDetails, MatchState } from '@/store/cricket/types/scoring';
import { MATCH_RULES } from '@/constants/scoring';

export class CricketScoringError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'CricketScoringError';
    }
}

export const validateDelivery = (
    delivery: DeliveryDetails,
    matchState: MatchState
): void => {
    if (!delivery.batsmanId) {
        throw new CricketScoringError(
            'No batsman selected',
            'INVALID_BATSMAN'
        );
    }

    if (!delivery.bowlerId) {
        throw new CricketScoringError(
            'No bowler selected',
            'INVALID_BOWLER'
        );
    }

    if (delivery.runs < 0) {
        throw new CricketScoringError(
            'Invalid runs value',
            'INVALID_RUNS'
        );
    }

    // Validate over limits
    const bowler = matchState.bowlingTeam.players.find(
        p => p.id === delivery.bowlerId
    );
    if (bowler && bowler.overs >= MATCH_RULES.MAX_OVERS_PER_BOWLER) {
        throw new CricketScoringError(
            'Bowler has exceeded maximum overs',
            'OVER_LIMIT_EXCEEDED'
        );
    }
};