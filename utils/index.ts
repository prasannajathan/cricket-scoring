import { Cricketer, ScoreboardState, Team } from '@/types';

export const checkInningsCompletionHelper = (state: ScoreboardState) => {
  const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
  
  // Guard against checking incomplete innings
  if (!currentInnings.battingTeamId || !currentInnings.bowlingTeamId) {
      return;
  }
  
  // Check for completion conditions
  const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
  const allOut = currentInnings.wickets >= battingTeam.players.filter(p => !p.isRetired).length - 1;
  const oversComplete = currentInnings.completedOvers >= state.totalOvers;
  const targetReached = state.currentInning === 2 && 
                        state.targetScore && 
                        currentInnings.totalRuns >= state.targetScore;
  
  // Set isAllOut flag if appropriate
  if (allOut) {
    currentInnings.isAllOut = true;
  }
  
  if (allOut || oversComplete || targetReached) {
      if (state.currentInning === 2) {
          currentInnings.isCompleted = true;
          state.matchOver = true;

          // Set match result
          if (currentInnings.totalRuns >= (state.targetScore || 0)) {
              const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
              
              // Use the calculateRemainingWickets function for consistency
              const remainingWickets = calculateRemainingWickets(battingTeam, currentInnings.wickets, state);
              
              state.matchResult = `${battingTeam.teamName} wins by ${remainingWickets} wickets`;
          } else {
              const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
              state.matchResult = `${bowlingTeam.teamName} wins by ${(state.targetScore || 0) - currentInnings.totalRuns} runs`;
          }
      }
      // For first innings, just set a flag for the UI but don't mark as completed
      else {
          state.innings1.readyForInnings2 = true;
      }
  }
};

// Add this helper function to your scoreboardSlice.ts
export const updateBatsmenPositions = (
  state: ScoreboardState,
  newStrikerId: string | undefined,
  newNonStrikerId: string | undefined,
) => {
  // Get the current innings
  const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
  
  
  // Update the innings state
  currentInnings.currentStrikerId = newStrikerId;
  currentInnings.currentNonStrikerId = newNonStrikerId;
  
  // Find the batting team and update its state too
  if (currentInnings.battingTeamId === state.teamA.id) {
    state.teamA.currentStrikerId = newStrikerId;
    state.teamA.currentNonStrikerId = newNonStrikerId;
  } else {
    state.teamB.currentStrikerId = newStrikerId;
    state.teamB.currentNonStrikerId = newNonStrikerId;
  }
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

export const calculateRemainingWickets = (
    battingTeam: Team, 
    wicketsFallen: number,
    state: ScoreboardState
): number => {
    // Get the total players from state instead of counting or hardcoding
    const totalPlayers = state.totalPlayers;
    
    // Count active (non-retired) players
    const activePlayersCount = battingTeam.players.filter(p => !p.isRetired).length;
    
    // Use the minimum of totalPlayers or actual active players to be safe
    const effectiveTotalPlayers = Math.min(totalPlayers, activePlayersCount);
    
    // In cricket, you need at least one player at each end, so max wickets is totalPlayers - 1
    const maxWickets = Math.max(1, effectiveTotalPlayers - 1);
    
    // Calculate remaining wickets (ensuring it's never negative)
    return Math.max(0, maxWickets - wicketsFallen);
};
