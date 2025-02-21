import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ScoringButtonsProps {
    onScore: (runs: number) => void;
    canScore: boolean;
    onAdvancedScore: () => void;
}

export default function ScoringButtons({
    onScore,
    canScore,
    onAdvancedScore
}: ScoringButtonsProps) {
    const RunButton = ({ runs }: { runs: number }) => (
        <TouchableOpacity
            style={[styles.runButton, !canScore && styles.disabledButton]}
            onPress={() => onScore(runs)}
            disabled={!canScore}
        >
            <Text style={[styles.runText, !canScore && styles.disabledText]}>
                {runs}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <RunButton runs={0} />
                <RunButton runs={1} />
                <RunButton runs={2} />
                <RunButton runs={3} />
            </View>
            <View style={styles.row}>
                <RunButton runs={4} />
                <RunButton runs={6} />
                <TouchableOpacity
                    style={[styles.runButton, styles.advancedButton]}
                    onPress={onAdvancedScore}
                >
                    <Text style={styles.runText}>...</Text>
                </TouchableOpacity>
            </View>
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
    runButton: {
        flex: 1,
        backgroundColor: '#1B5E20',
        padding: 16,
        margin: 4,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    runText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    advancedButton: {
        backgroundColor: '#2E7D32',
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
    },
    disabledText: {
        color: '#9E9E9E',
    }
});