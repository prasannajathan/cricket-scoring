import { Cricketer } from '@/types';

// export function computeCRR(runs: number, overs: number): string {
// // If no deliveries have been bowled, CRR is 0.00 by definition
// if (overs <= 0) {
//     return '0.00';
//   }

//   const wholeOvers = Math.floor(overs);
//   // Fractional part of the overs (e.g. 4.3 overs => 0.3)
//   const fraction = overs - wholeOvers;
//   // Convert fraction to balls (0.3 => ~3 balls)
//   const balls = Math.round(fraction * 10);

//   // totalOversDecimal = total overs in decimal, e.g. 4 overs + 3/6 = 4.5
//   const totalOversDecimal = wholeOvers + balls / 6;

//   // Double-check in case rounding leaves totalOversDecimal at 0
//   if (totalOversDecimal === 0) {
//     return '0.00';
//   }

//   const crr = runs / totalOversDecimal;
//   return crr.toFixed(2);
// }

/** computeCRR uses overs as (completedOvers + ballInCurrentOver/6) */
export function computeCRR(runs: number, completedOvers: number, ballInCurrentOver: number): string {
  const totalBalls = completedOvers * 6 + ballInCurrentOver;
  if (totalBalls === 0) return '0.00';
  const oversDecimal = totalBalls / 6;
  const crr = runs / oversDecimal;
  return crr.toFixed(2);
}

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