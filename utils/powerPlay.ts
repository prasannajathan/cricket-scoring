export enum PowerPlayType {
    MANDATORY = 'mandatory',
    BATTING = 'batting',
    BOWLING = 'bowling'
}

export interface PowerPlay {
    type: PowerPlayType;
    startOver: number;
    endOver: number;
    maxFielders: number;
}

export const POWERPLAY_RULES = {
    T20: {
        [PowerPlayType.MANDATORY]: { overs: 6, maxFielders: 2 },
        [PowerPlayType.BATTING]: { overs: 2, maxFielders: 3 },
        [PowerPlayType.BOWLING]: { overs: 2, maxFielders: 3 }
    }
};

export const isPowerPlayOver = (
    overNumber: number,
    powerPlays: PowerPlay[]
): PowerPlay | undefined => {
    return powerPlays.find(pp => 
        overNumber >= pp.startOver && overNumber <= pp.endOver
    );
};

export const getRemainingPowerPlayOvers = (
    currentOver: number,
    powerPlays: PowerPlay[]
): { [key in PowerPlayType]: number } => {
    return Object.values(PowerPlayType).reduce((acc, type) => {
        const powerPlay = powerPlays.find(pp => pp.type === type);
        if (!powerPlay) return acc;

        const remaining = Math.max(0, 
            powerPlay.endOver - Math.max(currentOver, powerPlay.startOver)
        );

        return { ...acc, [type]: remaining };
    }, {} as { [key in PowerPlayType]: number });
};