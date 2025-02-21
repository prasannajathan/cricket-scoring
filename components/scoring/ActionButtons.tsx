import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ActionButtonsProps {
    canScore: boolean;
    onUndo: () => void;
    onSwap: () => void;
    onPartnership: () => void;
    onExtras: () => void;
    onBowlerChange?: () => void;
}

export default function ActionButtons({
    canScore,
    onUndo,
    onSwap,
    onPartnership,
    onExtras,
    onBowlerChange
}: ActionButtonsProps) {
    const ActionButton = ({ 
        label, 
        onPress, 
        color = '#2E7D32' 
    }: { 
        label: string; 
        onPress: () => void; 
        color?: string;
    }) => (
        <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: color }]}
            onPress={onPress}
        >
            <Text style={styles.actionText}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <ActionButton label="Undo" onPress={onUndo} color="#D32F2F" />
                <ActionButton label="Swap" onPress={onSwap} />
            </View>
            <View style={styles.row}>
                <ActionButton label="Partnership" onPress={onPartnership} />
                <ActionButton label="Extras" onPress={onExtras} />
            </View>
            {onBowlerChange && (
                <View style={styles.row}>
                    <ActionButton 
                        label="Change Bowler" 
                        onPress={onBowlerChange} 
                        color="#1565C0" 
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
        padding: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    actionButton: {
        flex: 1,
        padding: 12,
        margin: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    }
});