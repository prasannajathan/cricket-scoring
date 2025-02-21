import { DeliveryDetails } from '@/store/cricket/types/scoring';
import { Team } from '@/store/cricket/types';

export interface SuperOverState {
    isActive: boolean;
    currentInning: 1 | 2;
    team1Score: number;
    team2Score: number;
    team1Wickets: number;
    team2Wickets: number;
    battingTeam: Team;
    bowlingTeam: Team;
    deliveries: DeliveryDetails[];
}

export const initializeSuperOver = (
    team1: Team,
    team2: Team,
    tossWinner: Team,
    tossChoice: 'bat' | 'bowl'
): SuperOverState => {
    const batting = tossChoice === 'bat' ? tossWinner : 
        (tossWinner.id === team1.id ? team2 : team1);
    const bowling = batting.id === team1.id ? team2 : team1;

    return {
        isActive: true,
        currentInning: 1,
        team1Score: 0,
        team2Score: 0,
        team1Wickets: 0,
        team2Wickets: 0,
        battingTeam: batting,
        bowlingTeam: bowling,
        deliveries: []
    };
};

export const isSuperOverComplete = (state: SuperOverState): boolean => {
    if (state.currentInning === 1) return false;
    
    // Second innings conditions
    return state.team2Wickets === 2 || // All out (2 wickets in super over)
           state.team2Score > state.team1Score || // Chasing team wins
           (state.deliveries.filter(d => d.extraType !== 'wide' && 
                                       d.extraType !== 'no-ball').length >= 6); // Over complete
};

export const getSuperOverResult = (state: SuperOverState): string => {
    if (!isSuperOverComplete(state)) return '';

    const difference = Math.abs(state.team1Score - state.team2Score);
    
    if (state.team1Score > state.team2Score) {
        return `${state.bowlingTeam.teamName} wins Super Over by ${difference} runs`;
    } else if (state.team2Score > state.team1Score) {
        return `${state.battingTeam.teamName} wins Super Over by ${
            2 - state.team2Wickets} wickets`;
    }
    
    return 'Super Over tied';
};