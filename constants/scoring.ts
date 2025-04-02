import { WicketType, ExtraType } from '@/types/scoring';
import { ScoreboardState } from '@/types';
import { initialState } from '@/store/cricket/initialState';

const BALLS_PER_OVER = 6

export const getMatchRules = (state: ScoreboardState) => {
    const { totalOvers, totalPlayers } = state;
    
    // Calculate max overs per bowler (20% of total overs, rounded up)
    const maxOversPerBowler = Math.ceil(totalOvers * 0.2);
    
    // Minimum bowlers needed (total overs / max overs per bowler, rounded up)
    const minBowlers = Math.ceil(totalOvers / maxOversPerBowler);

    return {
        MAX_OVERS_PER_BOWLER: maxOversPerBowler,
        BALLS_PER_OVER,
        MIN_PLAYERS: totalPlayers,
        MAX_PLAYERS: totalPlayers,
        MIN_BATSMEN: 2,
        MIN_BOWLERS: minBowlers,
    } as const;
};

// Example usage with default state for backward compatibility
export const getDefaultMatchRules = () => getMatchRules({
    ...initialState,
    totalOvers: 20,
    totalPlayers: 11
});

export const T20_MATCH_RULES = getDefaultMatchRules();

// const rules = getMatchRules({ totalOvers: 50, totalPlayers: 11 }); // For ODI
// console.log(rules.MAX_OVERS_PER_BOWLER); // 10 overs
// console.log(rules.MIN_BOWLERS); // 5 bowlers

export const WICKET_TYPES: Record<WicketType, string> = {
    'bowled': 'b',
    'caught': 'c',
    'lbw': 'lbw',
    'run out': 'run out',
    'stumped': 'st',
    'hit wicket': 'hit wicket',
    'retired hurt': 'retired hurt'
} as const;

export const EXTRA_TYPES: Record<ExtraType, string> = {
    'wide': 'wd',
    'no-ball': 'nb',
    'bye': 'b',
    'leg-bye': 'lb'
} as const;

// Example usage in a component
// import { useSelector } from 'react-redux';
// import { getMatchRules } from '@/constants/scoring';
// import { RootState } from '@/store';

// export const BowlerDisplay = () => {
//     const state = useSelector((state: RootState) => state.scoreboard);
//     const rules = getMatchRules(state);
    
//     // Use rules.MAX_OVERS_PER_BOWLER, etc.
//     // ...rest of the component
// };