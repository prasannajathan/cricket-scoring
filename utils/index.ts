import { Cricketer, ScoreboardState, Team } from '@/types';

export const checkInningsCompletionHelper = (state: ScoreboardState) => {
  const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
  
  // Guard against checking incomplete innings
  if (!currentInnings.battingTeamId || !currentInnings.bowlingTeamId) {
      return;
  }
  
  // Check for completion conditions
  const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
  
  // Set all out flag if appropriate (using totalPlayers)
  const allOut = currentInnings.wickets >= state.totalPlayers - 1;
  const oversComplete = currentInnings.completedOvers >= state.totalOvers;
  const targetReached = state.currentInning === 2 && 
                        state.targetScore && 
                        currentInnings.totalRuns >= state.targetScore;
  
  if (allOut) {
    currentInnings.isAllOut = true;
  }
  
  if (allOut || oversComplete || targetReached) {
    if (state.currentInning === 2) {
      // Second innings is over, match is completed
      currentInnings.isCompleted = true;
      state.matchOver = true;
      
      // Use our centralized function to calculate the result
      calculateMatchResult(state);
    } else {
      // For first innings, just set a flag for the UI but don't mark as completed
      state.innings1.readyForInnings2 = true;
    }
  }
};

/**
 * Calculates match result and sets state appropriately
 * This centralizes all match result logic to avoid duplication
 */
export const calculateMatchResult = (state: ScoreboardState): void => {
  // Only calculate if match is over
  if (!state.matchOver) return;
  
  // Get both innings data
  const innings1 = state.innings1;
  const innings2 = state.innings2;
  
  // We need batting team identities
  const team1 = state[innings1.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
  const team2 = state[innings2.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
  
  // Calculate run difference (absolute value)
  const runDifference = Math.abs(innings1.totalRuns - innings2.totalRuns);
  
  // Handle various result scenarios
  if (innings1.totalRuns === innings2.totalRuns) {
    // Match tied
    state.matchResult = "Match tied";
  }
  else if (innings2.totalRuns > innings1.totalRuns) {
    // Team batting second won
    const remainingWickets = calculateRemainingWickets(team2, innings2.wickets, state);
    state.matchResult = `${team2.teamName} wins by ${remainingWickets} wicket${remainingWickets !== 1 ? 's' : ''}`;
  }
  else {
    // Team batting first won
    state.matchResult = `${team1.teamName} wins by ${runDifference} run${runDifference !== 1 ? 's' : ''}`;
  }
  
  // Set match as over
  state.matchOver = true;
  innings2.isCompleted = true;
}

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
    const activePlayersCount = battingTeam.players.filter(p => !p.isOut).length;
    
    // Use the minimum of totalPlayers or actual active players to be safe
    const effectiveTotalPlayers = Math.min(totalPlayers, activePlayersCount);
    
    // In cricket, you need at least one player at each end, so max wickets is totalPlayers - 1
    const maxWickets = Math.max(1, effectiveTotalPlayers - 1);
    
    // Calculate remaining wickets (ensuring it's never negative)
    return Math.max(0, maxWickets - wicketsFallen);
};
