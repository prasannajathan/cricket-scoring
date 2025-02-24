import { Cricketer } from '@/types';

export const computeCRR = (runs: number, overs: number, balls: number): string => {
    const totalOvers = overs + (balls / 6);
    if (totalOvers === 0) return '0.00';
    return (runs / totalOvers).toFixed(2);
};

export const computeRRR = (runsNeeded: number, oversLeft: number): string => {
    if (oversLeft <= 0) return 'N/A';
    return (runsNeeded / oversLeft).toFixed(2);
};

/** Helper to create a minimal Cricketer object */
export function createCricketer(id: string, name: string): Cricketer {
  return {
    id,
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
    isOut: false,
    overs: 0,
    ballsThisOver: 0,
    runsConceded: 0,
    wickets: 0,
    economy: 0,
    maidens: 0,
    catches: 0,
    runouts: 0,
  };
}