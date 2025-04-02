import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
    colors,
    spacing,
    typography,
    radius,
    commonStyles,
    shadows
} from '@/constants/theme';
import sStyles from '@/styles/overExtraWicketRows';

interface ExtrasToggleProps {
    wide: boolean;
    noBall: boolean;
    bye: boolean;
    legBye: boolean;
    setWide: (value: boolean) => void;
    setNoBall: (value: boolean) => void;
    setBye: (value: boolean) => void;
    setLegBye: (value: boolean) => void;
}

export default function ExtrasToggle({
    wide,
    noBall,
    bye,
    legBye,
    setWide,
    setNoBall,
    setBye,
    setLegBye,
}: ExtrasToggleProps) {
    // Get icon for each extra type
    const getExtraIcon = (extraType: string) => {
        switch(extraType) {
            case 'Wide': return 'arrows-h';
            case 'No Ball': return 'warning';
            case 'Bye': return 'share';
            case 'Leg Bye': return 'child';
            default: return 'plus-circle';
        }
    };

    // Get color for each extra type
    const getExtraColor = (extraType: string, isActive: boolean) => {
        if (!isActive) return colors.brandBlue;
        
        switch(extraType) {
            case 'Wide': return colors.orange;
            case 'No Ball': return colors.brandRed;
            case 'Bye': return colors.brandGreen;
            case 'Leg Bye': return colors.brandTeal;
            default: return colors.brandBlue;
        }
    };

    const ToggleButton = ({
        label,
        isActive,
        onToggle
    }: {
        label: string;
        isActive: boolean;
        onToggle: () => void;
    }) => {
        const icon = getExtraIcon(label);
        const buttonColor = getExtraColor(label, isActive);
        
        return (
            <TouchableOpacity
                style={[
                    styles.toggleButton, 
                    { backgroundColor: isActive ? buttonColor : colors.white },
                    isActive ? styles.activeToggle : styles.inactiveToggle
                ]}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <FontAwesome 
                    name={icon} 
                    size={12} 
                    color={isActive ? colors.white : colors.brandDark + '80'} 
                    style={styles.toggleIcon} 
                />
                <Text style={[
                    styles.toggleText, 
                    isActive ? styles.activeText : styles.inactiveText
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <FontAwesome name="plus-circle" size={16} color={colors.orange} style={styles.headerIcon} />
                <Text style={styles.sectionTitle}>Extras</Text>
            </View>
            
            <View style={styles.extrasRow}>
                <ToggleButton
                    label="Wide"
                    isActive={wide}
                    onToggle={() => {
                        setWide(!wide);
                        if (!wide) {
                            // Clear incompatible extras
                            setNoBall(false);
                            setBye(false);
                            setLegBye(false);
                        }
                    }}
                />
                <ToggleButton
                    label="No Ball"
                    isActive={noBall}
                    onToggle={() => {
                        setNoBall(!noBall);
                        if (!noBall) {
                            // Clear incompatible extras
                            setWide(false);
                        }
                    }}
                />
                <ToggleButton
                    label="Bye"
                    isActive={bye}
                    onToggle={() => {
                        setBye(!bye);
                        if (!bye) {
                            // Clear incompatible extras
                            setWide(false);
                            setLegBye(false);
                        }
                    }}
                />
                <ToggleButton
                    label="Leg Bye"
                    isActive={legBye}
                    onToggle={() => {
                        setLegBye(!legBye);
                        if (!legBye) {
                            // Clear incompatible extras
                            setWide(false);
                            setBye(false);
                        }
                    }}
                />
            </View>
{/*             
            {(wide || noBall || bye || legBye) && (
                <View style={styles.helpTextContainer}>
                    <FontAwesome name="info-circle" size={12} color={colors.brandBlue} style={styles.helpIcon} />
                    <Text style={styles.helpText}>
                        {wide && "Wide: The ball is bowled too wide for the batsman to play a normal cricket shot."}
                        {noBall && "No ball: The bowler's delivery does not comply with the rules."}
                        {bye && "Bye: Runs scored when the ball passes the batsman without touching bat or body."}
                        {legBye && "Leg bye: Runs scored when the ball hits the batsman's body (but not the bat)."}
                    </Text>
                </View>
            )} */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    headerIcon: {
        marginRight: spacing.xs,
    },
    sectionTitle: {
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
    },
    extrasRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: spacing.sm,
        gap: spacing.sm,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minWidth: 80,
        justifyContent: 'center',
    },
    activeToggle: {
        ...shadows.button,
    },
    inactiveToggle: {
        borderWidth: 1,
        borderColor: colors.brandLight,
    },
    toggleIcon: {
        marginRight: spacing.xs,
    },
    toggleText: {
        fontSize: typography.sizeSM,
        fontWeight: typography.weightSemiBold,
    },
    activeText: {
        color: colors.white,
    },
    inactiveText: {
        color: colors.brandDark + '80', // 80% opacity
    },
    helpTextContainer: {
        flexDirection: 'row',
        backgroundColor: colors.brandLight + '30', // 30% opacity
        padding: spacing.sm,
        borderRadius: radius.md,
        marginTop: spacing.sm,
    },
    helpIcon: {
        marginRight: spacing.xs,
        marginTop: 2, // Align with text
    },
    helpText: {
        flex: 1,
        fontSize: typography.sizeSM,
        color: colors.brandDark + 'CC', // 80% opacity
        lineHeight: typography.sizeSM * 1.4,
    },
});