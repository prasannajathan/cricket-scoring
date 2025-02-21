import { MATCH_RULES } from '@/constants/scoring';

export interface RunRateStats {
    runsScored: number;
    oversFaced: number;
    runsConceded: number;
    oversBowled: number;
}

export const calculateNetRunRate = (stats: RunRateStats): number => {
    const battingRunRate = calculateRunRate(stats.runsScored, stats.oversFaced);
    const bowlingRunRate = calculateRunRate(stats.runsConceded, stats.oversBowled);
    return Number((battingRunRate - bowlingRunRate).toFixed(3));
};

const calculateRunRate = (runs: number, overs: number): number => {
    if (overs === 0) return 0;
    const completeOvers = Math.floor(overs);
    const balls = (overs % 1) * 10;
    const totalOvers = completeOvers + (balls / MATCH_RULES.BALLS_PER_OVER);
    return Number((runs / totalOvers).toFixed(3));
};