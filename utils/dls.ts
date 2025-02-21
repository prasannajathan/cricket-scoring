interface DLSResourceTable {
    [overs: number]: {
        [wickets: number]: number;
    };
}

export const DLS_RESOURCE_TABLE: DLSResourceTable = {
    50: { 0: 100.0, 1: 93.4, 2: 85.1, 3: 74.9, 4: 62.7, 5: 49.0, 6: 34.9, 7: 22.0, 8: 11.9, 9: 4.7 },
    // ... more overs data
    1: { 0: 2.4, 1: 2.2, 2: 2.0, 3: 1.7, 4: 1.4, 5: 1.1, 6: 0.8, 7: 0.5, 8: 0.3, 9: 0.1 }
};

export const calculateTargetScore = (
    team1Score: number,
    oversPlayed1: number,
    wicketsLost1: number,
    oversAvailable2: number,
    rain: boolean = false
): number => {
    const resourcesTeam1 = DLS_RESOURCE_TABLE[Math.floor(oversPlayed1)][wicketsLost1];
    const resourcesTeam2 = DLS_RESOURCE_TABLE[Math.floor(oversAvailable2)][0];
    
    const target = Math.ceil((team1Score * resourcesTeam2) / resourcesTeam1);
    return rain ? target + 1 : target;
};