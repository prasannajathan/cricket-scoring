import React, {useCallback} from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
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
    totalOvers?: number;
}

export default function ScoreHeader({
    battingTeam,
    currentInnings,
    currentInning,
    targetScore,
    matchResult,
    totalOvers,
}: ScoreHeaderProps) {
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
          StatusBar.setTranslucent(true);
          StatusBar.setBarStyle('light-content');
    
          return () => {
            StatusBar.setTranslucent(false);
            StatusBar.setBarStyle('dark-content');
          };
        }, [])
      );

    const computeRunRate = (runs: number, overs: number, balls: number) => {
        const totalOvers = overs + (balls / 6);
        return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
    };

    const computeRRR = (runsNeeded: number, oversLeft: number, ballsInOver: number): string => {
        if (!totalOvers) return 'N/A';
        const remainingOvers = totalOvers - oversLeft - (ballsInOver / 6);
        if (remainingOvers <= 0) return 'N/A';
        return (runsNeeded / remainingOvers).toFixed(2);
    };

    const calculateRemainingBalls = () => {
        if (!currentInnings || !totalOvers) return 0;
        const totalBalls = totalOvers * 6;
        const usedBalls = (currentInnings.completedOvers * 6) + currentInnings.ballInCurrentOver;
        return totalBalls - usedBalls;
    };

    const remainingBalls = calculateRemainingBalls();
    const partnership = currentInnings?.currentPartnership || { runs: 0, balls: 0 };
    const runsNeeded = targetScore && currentInnings
        ? Math.max(0, targetScore - currentInnings.totalRuns)
        : 0;

    // Determine if the match is close (required run rate is high or low)
    const isChaseUnderPressure = () => {
        if (currentInning !== 2 || !targetScore || !currentInnings || !totalOvers) return false;

        const remainingOvers = totalOvers - currentInnings.completedOvers - (currentInnings.ballInCurrentOver / 6);
        if (remainingOvers <= 0) return false;

        const requiredRunRate = runsNeeded / remainingOvers;
        return requiredRunRate > 10; // High required run rate
    };

    const isChaseComfortable = () => {
        if (currentInning !== 2 || !targetScore || !currentInnings || !totalOvers) return false;

        const remainingOvers = totalOvers - currentInnings.completedOvers - (currentInnings.ballInCurrentOver / 6);
        if (remainingOvers <= 0) return false;

        const requiredRunRate = runsNeeded / remainingOvers;
        const wicketsLeft = 10 - (currentInnings.wickets || 0);

        return requiredRunRate < 6 && wicketsLeft > 5; // Low required run rate and plenty of wickets
    };

    const homeTab = () => {
        router.push('/history')
    };

    return (
        <View style={styles.heroContainer}>
            <ImageBackground
                source={require('@/assets/images/stadium-1.png')}
                style={styles.heroImage}
                imageStyle={styles.heroImageStyle}
            >
                <View style={styles.heroOverlay} />
                <SafeAreaView>
                    <View style={styles.heroContent}>
                        {/* Team and Current Score */}
                        <View style={styles.scoreHeader}>
                        <TouchableOpacity style={styles.back}
                             onPress={homeTab}>
                                <FontAwesome name="chevron-left" size={24} color={colors.white} style={styles.backIcon} />
                            </TouchableOpacity>
                            <Text style={styles.teamName}>
                                {battingTeam?.teamName}
                            </Text>
                        </View>

                        <View style={styles.scoreRow}>
                            <Text style={styles.score}>
                                {currentInnings?.totalRuns || 0}
                                <Text style={styles.scoreDelimiter}>/</Text>
                                {currentInnings?.wickets || 0}
                            </Text>

                            <View style={styles.oversContainer}>
                                <Text style={styles.oversLabel}>Overs</Text>
                                <Text style={styles.oversValue}>
                                    {currentInnings?.completedOvers || 0}
                                    <Text style={styles.oversDot}>.</Text>
                                    {currentInnings?.ballInCurrentOver || 0}
                                </Text>
                            </View>
                        </View>

                        {/* Match Status for 2nd Innings */}
                        {currentInning === 2 && targetScore && !matchResult && (
                            <View style={[
                                styles.targetResultContainer,
                                isChaseUnderPressure() ? styles.pressureTarget : null,
                                isChaseComfortable() ? styles.comfortableTarget : null
                            ]}>
                                <FontAwesome
                                    name={
                                        isChaseUnderPressure() ? "tachometer" :
                                            isChaseComfortable() ? "thumbs-up" : "flag-checkered"
                                    }
                                    size={16}
                                    color={colors.white}
                                    style={styles.targetResultIcon}
                                />
                                <Text style={styles.targetResultText}>
                                    {`Target: ${targetScore} (${runsNeeded} needed from ${remainingBalls} balls)`}
                                </Text>
                            </View>
                        )}

                        {/* Match Result */}
                        {matchResult && (
                            <View style={styles.targetResultContainer}>
                                <FontAwesome name="trophy" size={16} color={colors.white} style={styles.targetResultIcon} />
                                <Text style={styles.targetResultText}>{matchResult}</Text>
                            </View>
                        )}

                        {/* Stats Row: CRR, REQ, Partnership */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>CRR</Text>
                                <Text style={styles.statValue}>
                                    {computeRunRate(
                                        currentInnings?.totalRuns || 0,
                                        currentInnings?.completedOvers || 0,
                                        currentInnings?.ballInCurrentOver || 0
                                    )}
                                </Text>
                            </View>

                            {currentInning === 2 && targetScore && (
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>REQ</Text>
                                    <Text style={[
                                        styles.statValue,
                                        isChaseUnderPressure() ? styles.pressureStatValue : null,
                                        isChaseComfortable() ? styles.comfortableStatValue : null
                                    ]}>
                                        {computeRRR(
                                            runsNeeded,
                                            currentInnings?.completedOvers || 0,
                                            currentInnings?.ballInCurrentOver || 0
                                        )}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>P'SHIP</Text>
                                <Text style={styles.statValue}>
                                    {partnership.runs}
                                    <Text style={styles.statSubValue}>
                                        ({partnership.balls})
                                    </Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    /* Hero Scoreboard */
    heroContainer: {
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        minHeight: 180,
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
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    heroContent: {
        paddingHorizontal: spacing.md,
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    teamName: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeLG,
        color: colors.white,
        fontWeight: typography.weightBold,
    },
    back: {
        color: colors.white,
        marginRight: spacing.lg,
    },
    backIcon: {
        // padding: spacing.sm,
        // borderRadius: radius.xl,
        // backgroundColor: colors.white,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    score: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeXXL,
        color: colors.white,
        fontWeight: '800',
    },
    scoreDelimiter: {
        color: colors.white + '80', // 80% opacity
        fontSize: 36,
    },
    oversContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: radius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        // minWidth: 80,
    },
    oversLabel: {
        color: colors.white + '90', // 90% opacity
        fontSize: typography.sizeSM,
        marginBottom: 2,
    },
    oversValue: {
        color: colors.white,
        fontSize: typography.sizeMD,
        fontWeight: '600',
    },
    oversDot: {
        color: colors.white + '70', // 70% opacity
    },
    targetResultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,100,255,0.4)',
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.sm,
    },
    pressureTarget: {
        backgroundColor: 'rgba(255,50,50,0.4)',
    },
    comfortableTarget: {
        backgroundColor: 'rgba(50,200,50,0.4)',
    },
    targetResultIcon: {
        marginRight: spacing.sm,
    },
    targetResultText: {
        color: colors.white,
        fontSize: typography.sizeMD,
    },

    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: typography.sizeSM,
    },
    statLabel: {
        color: colors.white + '80',
        marginBottom: 2,
        marginRight: spacing.xs,
    },
    statValue: {
        color: colors.white,
        fontWeight: '600',
    },
    pressureStatValue: {
        color: '#FF9999',
    },
    comfortableStatValue: {
        color: '#99FF99',
    },
    statSubValue: {
        fontSize: typography.sizeSM,
        color: colors.white + '70', // 70% opacity
        fontWeight: 'normal',
    }
});