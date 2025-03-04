import { RootState } from '@/store';

export const selectCurrentInnings = (state: RootState) => 
    state.scoreboard.currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;

// Update these selectors to reliably determine the batting and bowling teams
export const selectBattingTeam = (state: RootState) => {
    const currentInning = state.scoreboard.currentInning;
    const innings = currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;
    
    // Using the battingTeamId to determine the correct team
    return innings.battingTeamId === state.scoreboard.teamA.id 
        ? state.scoreboard.teamA 
        : state.scoreboard.teamB;
};

export const selectBowlingTeam = (state: RootState) => {
    const currentInning = state.scoreboard.currentInning;
    const innings = currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;
    
    // Using the bowlingTeamId to determine the correct team
    return innings.bowlingTeamId === state.scoreboard.teamA.id 
        ? state.scoreboard.teamA 
        : state.scoreboard.teamB;
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