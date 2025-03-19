import React from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import { Team, InningsData } from '@/types';
import {
    colors,
    spacing,
    typography,
    radius,
    shadows
} from '@/constants/theme';

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

    return (
        <View style={styles.heroContainer}>
            {/* <StatusBar barStyle="light-content" /> */}
            <ImageBackground
                source={require('@/assets/images/stadium-1.png')}
                style={styles.heroImage}
                imageStyle={styles.heroImageStyle}
            >
                <View style={styles.heroOverlay} />
                <View style={styles.heroContent}>
                    {currentInning === 2 && targetScore && (
                        <Text style={styles.scoreStatus}>
                            {`${battingTeam?.teamName} Needs: ${Math.max(0, targetScore - (currentInnings?.totalRuns || 0))} runs`}
                        </Text>
                    )}
                    {matchResult && (
                        <Text style={styles.scoreStatus}>{matchResult}</Text>
                    )}

                    {/* Score Details */}

                    <Text style={styles.teamName}>{battingTeam?.teamName}</Text>
                    <Text style={styles.score}>{currentInnings?.totalRuns || 0} - {currentInnings?.wickets || 0}</Text>

                    <View style={styles.subInfo}>
                        {currentInning === 2 && targetScore && (
                            <Text style={styles.subInfoText}>
                                {`Target: ${targetScore}`}
                            </Text>
                        )}
                    </View>


                    {/* Partnership Info (CRR, REQ, Partnership) */}
                    <View style={styles.subInfoRow}>
                        <Text style={styles.subInfoText}>Overs: {currentInnings?.completedOvers || 0}.{currentInnings?.ballInCurrentOver || 0}</Text>

                        <Text style={styles.subInfoText}>{`CRR: ${computeRunRate(
                            currentInnings?.totalRuns || 0,
                            currentInnings?.completedOvers || 0,
                            currentInnings?.ballInCurrentOver || 0
                        )}`}</Text>
                        <Text style={styles.subInfoText}>
                            {currentInning === 2 && targetScore && (
                                <>{`REQ ${computeRRR(targetScore, currentInnings?.completedOvers || 0)}`}</>
                            )}
                        </Text>
                        {/* TODO: Implement partnership */}
                        <Text style={styles.subInfoText}>P'SHIP 0(2)</Text>
                    </View>

                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    /* Hero Scoreboard */
    heroContainer: {
        // borderRadius: radius.md,
        overflow: 'hidden',
        // marginBottom: spacing.xs,
        ...shadows.card,
    },
    heroImage: {
        width: '100%',
        height: 160,
        justifyContent: 'flex-end',
    },
    heroImageStyle: {
        resizeMode: 'cover',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', 
    },
    heroContent: {
        padding: spacing.md,
    },
    teamName: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeLG,
        color: colors.white,
        fontWeight: typography.weightBold,
    },
    score: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeXL,
        color: colors.white,
        marginTop: spacing.xs,
        fontWeight: typography.weightBold,
    },
    subInfoRow: {
        flexDirection: 'row',
        marginTop: spacing.xs,
    },
    subInfoText: {
        fontFamily: typography.fontFamilyRegular,
        fontSize: typography.sizeSM,
        color: colors.white,
        marginRight: spacing.md,
    },
    /* Score Status */
    scoreStatus: {
        // fontWeight: 'bold',
        // marginBottom: 12,
        // fontSize: 16,
    },
    subInfo: {
        alignItems: 'flex-end',
    }
});