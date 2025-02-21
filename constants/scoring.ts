export const MATCH_RULES = {
    MAX_OVERS_PER_BOWLER: 4,
    BALLS_PER_OVER: 6,
    MIN_PLAYERS: 11,
    MAX_PLAYERS: 11,
    MIN_BATSMEN: 2,
    MIN_BOWLERS: 5,
} as const;

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