import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Team, InningsData } from '@/types';

interface ScoreHeaderProps {
    battingTeam?: Team;
    currentInnings?: InningsData;
    currentInning: number;
    targetScore?: number;
    matchResult?: string;
}

export default function ScoreHeader({
    battingTeam,
    currentInnings,
    currentInning,
    targetScore,
    matchResult
}: ScoreHeaderProps) {

    const computeRunRate = (runs: number, overs: number, balls: number) => {
        const totalOvers = overs + (balls / 6);
        return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
    };

    const computeRRR = (runsNeeded: number, oversLeft: number): string => {
        if (oversLeft <= 0) return 'N/A';
        return (runsNeeded / oversLeft).toFixed(2);
    };

    // Make sure we're using targetScore correctly - log to debug
    console.log("ScoreHeader render complete state:", {
        currentInnings,
        targetScore,
        currentInning,
        currentRunsScored: currentInnings?.totalRuns,
        totalOvers: currentInnings?.completedOvers,
        ballsInOver: currentInnings?.ballInCurrentOver,
        battingTeam: battingTeam?.teamName,
        matchResult
    });

    return (
        <View style={styles.container}>
            {currentInning === 2 && targetScore && (
                <Text style={styles.scoreStatus}>
                    {`${battingTeam?.teamName} Needs: ${Math.max(0, targetScore - (currentInnings?.totalRuns || 0))} runs`}
                </Text>
            )}
            {matchResult && (
                <Text style={styles.scoreStatus}>{matchResult}</Text>
            )}

            {/* Score Details */}
            <View style={styles.scoreDetails}>
                <Text style={styles.teamScore}>{battingTeam?.teamName} {currentInnings?.totalRuns || 0}-{currentInnings?.wickets || 0}</Text>
                <View style={styles.subInfo}>
                    <Text style={styles.subInfoText}>Overs: {currentInnings?.completedOvers || 0}.{currentInnings?.ballInCurrentOver || 0}</Text>

                    {currentInning === 2 && targetScore && (
                        <Text style={styles.subInfoText}>
                            {`Target: ${targetScore}`}
                        </Text>
                    )}
                </View>
            </View>

            {/* Partnership Info (CRR, REQ, Partnership) */}
            <View style={styles.partnershipInfo}>
                <Text style={styles.infoItem}>{`CRR: ${computeRunRate(
                    currentInnings?.totalRuns || 0,
                    currentInnings?.completedOvers || 0,
                    currentInnings?.ballInCurrentOver || 0
                )}`}</Text>
                <Text style={styles.infoItem}>
                    {currentInning === 2 && targetScore && (
                        <>{`REQ ${computeRRR(targetScore, currentInnings?.completedOvers || 0)}`}</>
                    )}
                </Text>
                {/* TODO: Implement partnership */}
                <Text style={styles.infoItem}>P'SHIP 9(14)</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fefefe',
        padding: 16,
    },
    /* Score Status */
    scoreStatus: {
        fontWeight: 'bold',
        color: '#d00000',
        marginBottom: 12,
        fontSize: 16,
    },

    /* Score Details */
    scoreDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    teamScore: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    subInfo: {
        alignItems: 'flex-end',
    },
    subInfoText: {
        color: '#555',
        fontSize: 14,
    },

    /* Partnership and run-rate info */
    partnershipInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoItem: {
        fontSize: 14,
        color: '#666',
    },
});