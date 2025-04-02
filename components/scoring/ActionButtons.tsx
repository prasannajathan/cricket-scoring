import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

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
    // Helper function to determine icon for each action
    const getIconForAction = (action: string) => {
        switch (action) {
            case 'Undo':
                return 'undo';
            case 'Swap':
                return 'exchange';
            case 'Partnership':
                return 'link';
            case 'Extras':
                return 'plus-circle';
            case 'Penalty':
                return 'gavel';
            default:
                return 'circle';
        }
    };

    const ActionButton = ({
        label,
        onPress,
        color = colors.brandBlue,
        size = 'normal'
    }: {
        label: string;
        onPress: () => void;
        color?: string;
        size?: 'small' | 'normal' | 'large';
    }) => {
        const icon = getIconForAction(label);
        const buttonWidth = size === 'small' ? '31%' : size === 'large' ? '100%' : '48%';

        return (
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    {
                        backgroundColor: color,
                        width: buttonWidth
                    }
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <FontAwesome
                    name={icon}
                    size={16}
                    color={colors.white}
                    style={styles.buttonIcon}
                />
                <Text style={styles.actionButtonText}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <ActionButton
                    label="Undo"
                    onPress={onUndo}
                    color={colors.brandRed}
                    size="small"
                />
                <ActionButton
                    label="Swap"
                    onPress={onSwap}
                    color={colors.brandBlue}
                    size="small"
                />
                <ActionButton
                    label="Partnership"
                    onPress={onPartnership}
                    color={colors.orange}
                    size="small"
                />
            </View>

            <View style={styles.bottomRow}>
                <ActionButton
                    label="Extras"
                    onPress={onExtras}
                    color={colors.brandGreen}
                    size="normal"
                />
                <ActionButton
                    label="Penalty"
                    onPress={onAdvancedScore}
                    color={colors.brandCharcoal}
                    size="normal"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.lg,
        paddingBottom: spacing.md,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        ...shadows.button,
    },
    buttonIcon: {
        marginRight: spacing.xs,
    },
    actionButtonText: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeSM,
        color: colors.white,
        fontWeight: typography.weightSemiBold,
    },
});