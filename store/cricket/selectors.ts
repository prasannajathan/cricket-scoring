import { RootState } from '@/store';

export const selectCurrentInnings = (state: RootState) => 
    state.scoreboard.currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;

// Update these selectors to reliably determine the batting and bowling teams
export const selectBattingTeam = (state: RootState) => {
    const currentInning = state.scoreboard.currentInning;
    const innings = currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;
    
    // For setup of second innings, we need special handling
    if (currentInning === 2 && !innings.battingTeamId) {
        // If we're setting up the second innings but haven't saved battingTeamId yet
        // Infer from the first innings
        const firstInningsBowlingTeamId = state.scoreboard.innings1.bowlingTeamId;
        return firstInningsBowlingTeamId === state.scoreboard.teamA.id 
            ? state.scoreboard.teamA 
            : state.scoreboard.teamB;
    }
    
    // Normal case
    return innings.battingTeamId === state.scoreboard.teamA.id 
        ? state.scoreboard.teamA 
        : state.scoreboard.teamB;
};

export const selectBowlingTeam = (state: RootState) => {
    const currentInning = state.scoreboard.currentInning;
    const innings = currentInning === 1 ? state.scoreboard.innings1 : state.scoreboard.innings2;
    
    // For setup of second innings, we need special handling
    if (currentInning === 2 && !innings.bowlingTeamId) {
        // If we're setting up the second innings but haven't saved bowlingTeamId yet
        // Infer from the first innings
        const firstInningsBattingTeamId = state.scoreboard.innings1.battingTeamId;
        return firstInningsBattingTeamId === state.scoreboard.teamA.id 
            ? state.scoreboard.teamA 
            : state.scoreboard.teamB;
    }
    
    // Normal case
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