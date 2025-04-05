import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface ScoringButtonsProps {
    onScore: (runs: number) => void;
    canScore: boolean;
    disabled?: boolean;
}

export default function ScoringButtons({
    onScore,
    canScore,
    disabled 
}: ScoringButtonsProps) {
    // Add 5 to the runButtons array
    const runButtons = [0, 1, 2, 3, 4, 5, 6];

    return (
        <View style={styles.container}>
            {/* Main Scoring Buttons */}
            <View style={styles.scoringRow}>
                {runButtons.map((runs) => (
                    <TouchableOpacity
                        key={runs}
                        style={[
                            styles.runButton,
                            disabled ? styles.disabledButton : null,
                            runs === 0 ? styles.dotButton : null,
                            runs === 4 ? styles.fourButton : null,
                            runs === 5 ? styles.fiveButton : null,
                            runs === 6 ? styles.sixButton : null,
                            // !canScore ? styles.disabledButton : null
                        ]}
                        onPress={() => onScore(runs)}
                        // disabled={!canScore}
                        // activeOpacity={0.7}
                        activeOpacity={disabled ? 1 : 0.7}
                        disabled={disabled}
                    >
                        {runs === 0 ? (
                            <Text style={[styles.runText, styles.dotCircle]}>0</Text>
                        ) : (
                            <Text style={[
                                styles.runText,
                                runs === 4 || runs === 5 || runs === 6 ? styles.boundaryText : null,
                                !canScore ? styles.disabledText : null
                            ]}>
                                {runs}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    scoringRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    runButton: {
        flex: 1,
        marginHorizontal: 2, // Reduced horizontal margin to fit all 7 buttons
        height: 60,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.brandBlue,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    dotButton: {
        backgroundColor: colors.brandCharcoal,
    },
    dotCircle: {
        // width: 16,
        // height: 16,
        // borderRadius: 100,
        // backgroundColor: colors.white,
        // color: colors.white
    },
    fourButton: {
        backgroundColor: colors.brandGreen,
    },
    fiveButton: {
        backgroundColor: colors.brandTeal, // Use teal for 5 runs
    },
    sixButton: {
        backgroundColor: colors.brandRed,
    },
    runText: {
        color: colors.white,
        fontFamily: typography.fontFamilyBold || 'System',
        fontSize: typography.sizeLG,
        fontWeight: '700',
    },
    boundaryText: {
        fontWeight: typography.weightBold || '800',
        fontSize: typography.sizeXL,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        marginHorizontal: spacing.xs,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    extraButton: {
        backgroundColor: colors.orange,
    },
    wicketButton: {
        backgroundColor: colors.brandRed,
    },
    buttonIcon: {
        marginRight: spacing.xs,
    },
    actionButtonText: {
        color: colors.white,
        fontFamily: typography.fontFamilyBold || 'System',
        fontSize: typography.sizeMD,
        fontWeight: '600',
    },
    wicketText: {
        color: colors.white,
    },
    disabledButton: {
        backgroundColor: colors.brandLight + '80',
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    disabledText: {
        color: colors.ccc,
    }
});