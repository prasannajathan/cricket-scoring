import { RootState } from '@/store';

export const selectCurrentInnings = (state: RootState) => 
    state.scoreboard.currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;

export const selectBattingTeam = (state: RootState) => {
  const { teamA, teamB, currentInning } = state.scoreboard;
  const currentInnings = currentInning === 2 ? state.scoreboard.innings2 : state.scoreboard.innings1;
  return teamA.id === currentInnings.battingTeamId ? teamA : teamB;
};

export const selectBowlingTeam = (state: RootState) => {
  const { teamA, teamB, currentInning } = state.scoreboard;
  const currentInnings = currentInning === 2 ? state.scoreboard.innings2 : state.scoreboard.innings1;
  return teamA.id === currentInnings.bowlingTeamId ? teamA : teamB;
};

export const selectCurrentBowler = (state: RootState) => {
    const bowlingTeam = selectBowlingTeam(state);
    return bowlingTeam.players.find(p => p.id === bowlingTeam.currentBowlerId);
};

export const selectCurrentBatsmen = (state: RootState) => {
    const battingTeam = selectBattingTeam(state);
    return {
        striker: battingTeam.players.find(p => p.id === battingTeam.currentStrikerId),
        nonStriker: battingTeam.players.find(p => p.id === battingTeam.currentNonStrikerId)
    };
};

export const selectMatchProgress = (state: RootState) => {
    const currentInnings = selectCurrentInnings(state);
    return {
        currentOver: currentInnings.completedOvers,
        currentBall: currentInnings.ballInCurrentOver,
        totalOvers: state.scoreboard.totalOvers,
        targetScore: state.scoreboard.targetScore
    };
};