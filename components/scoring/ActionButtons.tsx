import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, commonStyles } from '@/constants/theme';
interface ActionButtonsProps {
    onUndo: () => void;
    onSwap: () => void;
    onPartnership: () => void;
    onExtras: () => void;
    onAdvancedScore: () => void;
}

export default function ActionButtons({
    onUndo,
    onSwap,
    onPartnership,
    onExtras,
    onAdvancedScore
}: ActionButtonsProps) {
    const ActionButton = ({
        label,
        onPress,
        color = colors.brandBlue
    }: {
        label: string;
        onPress: () => void;
        color?: string;
    }) => (
        <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: color }]}
            onPress={onPress}
        >
            <Text style={commonStyles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View>
            <View style={styles.actionsRow}>
                <ActionButton label="Undo" onPress={onUndo} color={colors.brandRed} />
                <ActionButton label="Swap" onPress={onSwap} />

                <ActionButton label="Partnership" onPress={onPartnership} />
                <ActionButton label="Extras" onPress={onExtras} />
                <ActionButton label="Penalty" onPress={onAdvancedScore} color={colors.brandCharcoal} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    actionsRow: {
        marginVertical: spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        backgroundColor: colors.brandBlue,
        borderRadius: radius.sm,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        alignItems: 'center',
    },
    actionButtonText: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeSM,
        color: colors.white,
        fontWeight: typography.weightSemiBold,
    },
});