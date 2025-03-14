import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
    colors,
    spacing,
    typography, radius, commonStyles
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
    const ToggleButton = ({
        label,
        isActive,
        onToggle
    }: {
        label: string;
        isActive: boolean;
        onToggle: () => void;
    }) => (
        <TouchableOpacity
            style={[styles.toggleButton, isActive && styles.activeToggle]}
            onPress={onToggle}
        >
            <Text style={[styles.toggleText, isActive && styles.activeText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={sStyles.sectionHeaderRow}>
            <Text style={commonStyles.sectionTitle}>Extras</Text>
            <View style={styles.extrasRow}>
                <ToggleButton
                    label="Wide"
                    isActive={wide}
                    onToggle={() => setWide(!wide)}
                />
                <ToggleButton
                    label="No Ball"
                    isActive={noBall}
                    onToggle={() => setNoBall(!noBall)}
                />
                <ToggleButton
                    label="Bye"
                    isActive={bye}
                    onToggle={() => setBye(!bye)}
                />
                <ToggleButton
                    label="Leg Bye"
                    isActive={legBye}
                    onToggle={() => setLegBye(!legBye)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    extrasRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',

        // maxWidth: 200,
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    toggleButton: {
        // flex: 1,
        backgroundColor: colors.brandBlue,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        // marginBottom: spacing.sm,
        alignItems: 'center',
    },
    activeToggle: {
        backgroundColor: '#1B5E20',
    },
    toggleText: {
        fontFamily: typography.fontFamilyRegular,
        fontSize: typography.sizeXS,
        color: colors.white,
    },
    activeText: {
        color: colors.white,
    },

    // container: {
    //     backgroundColor: '#fff',
    //     borderRadius: 8,
    //     marginBottom: 16,
    //     padding: 8,
    //     elevation: 2,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 1 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 1,
    // },
    // title: {
    //     fontSize: 16,
    //     fontWeight: 'bold',
    //     color: '#1B5E20',
    //     marginBottom: 8,
    // },
    // toggleRow: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    // },

});