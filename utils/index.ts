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