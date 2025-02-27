import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Team, InningsData } from '@/types';

interface ScoreHeaderProps {
    battingTeam: Team;
    currentInnings: InningsData;
    currentInning: number;
    targetScore?: number;
}

export default memo(function ScoreHeader({ 
    battingTeam, 
    currentInnings, 
    currentInning, 
    targetScore 
}: ScoreHeaderProps) {
    const computeRunRate = (runs: number, overs: number, balls: number) => {
        const totalOvers = overs + (balls / 6);
        return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
    };

    return (
        <View style={styles.container}>
            <Text style={styles.teamScore}>
                {`${battingTeam.teamName} ${currentInnings.totalRuns}/${currentInnings.wickets}`}
            </Text>
            <Text style={styles.overs}>
                {`(${currentInnings.completedOvers}.${currentInnings.ballInCurrentOver} ov)`}
            </Text>
            <View style={styles.rateContainer}>
                <Text style={styles.rateText}>
                    {`CRR: ${computeRunRate(
                        currentInnings.totalRuns,
                        currentInnings.completedOvers,
                        currentInnings.ballInCurrentOver
                    )}`}
                </Text>
                {currentInning === 2 && targetScore && (
                    <>
                        <Text style={styles.targetText}>
                            {`Target: ${targetScore}`}
                        </Text>
                        <Text style={styles.rateText}>
                            {`RRR: ${computeRunRate(
                                targetScore - currentInnings.totalRuns,
                                currentInnings.completedOvers,
                                currentInnings.ballInCurrentOver
                            )}`}
                        </Text>
                    </>
                )}
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.currentInnings.totalRuns === nextProps.currentInnings.totalRuns &&
           prevProps.currentInnings.wickets === nextProps.currentInnings.wickets &&
           prevProps.currentInnings.completedOvers === nextProps.currentInnings.completedOvers &&
           prevProps.currentInnings.ballInCurrentOver === nextProps.currentInnings.ballInCurrentOver;
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1B5E20',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    teamScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    overs: {
        fontSize: 16,
        color: '#fff',
        marginTop: 4,
    },
    rateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    rateText: {
        fontSize: 14,
        color: '#fff',
    },
    targetText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
});