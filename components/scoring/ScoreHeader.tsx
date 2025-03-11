import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
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
    const router = useRouter();

    const computeRunRate = (runs: number, overs: number, balls: number) => {
        const totalOvers = overs + (balls / 6);
        return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
    };

    // Make sure we're using targetScore correctly - log to debug
    console.log("ScoreHeader render complete state:", {
        targetScore,
        currentInning,
        currentRunsScored: currentInnings?.totalRuns,
        totalOvers: currentInnings?.completedOvers,
        ballsInOver: currentInnings?.ballInCurrentOver,
        battingTeam: battingTeam?.teamName,
        matchResult
    });

    const handleHomeTab = () => {
        router.push('/history');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleHomeTab}>
                <Text>Go to home</Text>
            </TouchableOpacity>
            <View>
                <Text style={styles.teamScore}>
                    {battingTeam?.teamName}: {currentInnings?.totalRuns || 0}/{currentInnings?.wickets || 0}
                </Text>
                <Text style={styles.overs}>
                    ({currentInnings?.completedOvers || 0}.{currentInnings?.ballInCurrentOver || 0} overs)
                </Text>
            </View>

            <View style={styles.rateContainer}>
                <Text style={styles.rateText}>
                    {`CRR: ${computeRunRate(
                        currentInnings?.totalRuns || 0,
                        currentInnings?.completedOvers || 0,
                        currentInnings?.ballInCurrentOver || 0
                    )}`}
                </Text>

                {/* Correctly show target for second innings */}
                {currentInning === 2 && targetScore && (
                    <>
                        <Text style={styles.targetText}>
                            {`Target: ${targetScore}`}
                        </Text>
                        <Text style={styles.rateText}>
                            {`Needs: ${Math.max(0, targetScore - (currentInnings?.totalRuns || 0))} runs`}
                        </Text>
                    </>
                )}
            </View>

            {/* Show match result when available */}
            {matchResult && (
                <View style={styles.matchResultContainer}>
                    <Text style={styles.matchResultText}>{matchResult}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    teamScore: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    overs: {
        fontSize: 16,
        marginTop: 4,
    },
    rateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    rateText: {
        fontSize: 14,
    },
    matchResultContainer: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        marginTop: 5,
    },
    matchResultText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    targetContainer: {
        marginTop: 5,
    },
    targetText: {
        fontSize: 14,
        color: '#D32F2F',
        fontWeight: 'bold',
    }
});