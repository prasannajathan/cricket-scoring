import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface ScoringButtonsProps {
    onScore: (runs: number) => void;
    canScore: boolean;
}

export default function ScoringButtons({
    onScore,
    canScore
}: ScoringButtonsProps) {
    const runButtons = [0, 1, 2, 3, 4, 6];

    return (
        <View>
            <View style={styles.scoringRow}>
                {runButtons.map((runs) => (
                    <TouchableOpacity
                        key={runs}
                        style={[
                            styles.runButton,
                            runs === 4 ? styles.fourButton : null,
                            runs === 6 ? styles.sixButton : null,
                            !canScore ? styles.disabledButton : null
                        ]}
                        onPress={() => onScore(runs)}
                        disabled={!canScore}
                    >
                        <Text style={[
                            styles.runText,
                            (runs === 4 || runs === 6) ? styles.boundaryText : null,
                            !canScore ? styles.disabledText : null
                        ]}>
                            {runs}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    scoringRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    runButton: {
        flex: 1,
        marginRight: spacing.xs,
        borderRadius: radius.sm,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.brandBlue,
    },
    runText: {
        color: colors.white,
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeMD,
    },
    fourButton: {
        backgroundColor: colors.brandGreen,
    },
    sixButton: {
        backgroundColor: colors.brandRed,
    },
    boundaryText: {
        fontWeight: typography.weightBold,
    },

    
    wicketButton: {
        backgroundColor: '#D32F2F',
    },
    wicketText: {
        color: 'white',
    },

    disabledButton: {
        backgroundColor: colors.ccc,
    },
    disabledText: {
        color: colors.brandDark,
    }
});