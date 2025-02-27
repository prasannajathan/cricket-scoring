import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ScoringButtonsProps {
    onScore: (runs: number) => void;
    canScore: boolean;
    onAdvancedScore: () => void;
    wicket: boolean;
    setWicket: (value: boolean) => void;
}

export default function ScoringButtons({ 
    onScore, 
    canScore, 
    onAdvancedScore, 
    wicket,
    setWicket
}: ScoringButtonsProps) {
    const runButtons = [0, 1, 2, 3, 4, 6];

    return (
        <View style={styles.container}>
            <View style={styles.runsContainer}>
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
            <TouchableOpacity
                style={[styles.runButton, styles.advancedButton]}
                onPress={onAdvancedScore}
            >
                <Text style={styles.runText}>Penalty</Text>
            </TouchableOpacity>
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
    runsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
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
    fourButton: {
        backgroundColor: '#FFEB3B',
    },
    sixButton: {
        backgroundColor: '#F44336',
    },
    boundaryText: {
        color: '#000',
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