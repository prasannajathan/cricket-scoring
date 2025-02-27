import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ScoringButtonsProps {
    onScore: (runs: number) => void;
    canScore: boolean;
    onAdvancedScore: () => void;
    wicket: boolean;  // Now used just for styling
    setWicket: () => void;  // Now expects a function with no parameters
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
                
                {/* Wicket Button */}
                <TouchableOpacity
                    style={[
                        styles.runButton,
                        styles.wicketButton,
                        !canScore ? styles.disabledButton : null
                    ]}
                    onPress={setWicket}
                    disabled={!canScore}
                >
                    <Text style={[
                        styles.runText,
                        styles.wicketText,
                        !canScore ? styles.disabledText : null
                    ]}>
                        W
                    </Text>
                </TouchableOpacity>
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
        marginVertical: 8,
    },
    runsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    runButton: {
        width: '31%',  // Three buttons per row
        aspectRatio: 1.5,
        backgroundColor: '#1B5E20',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 8,
    },
    runText: {
        color: 'white',
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
    wicketButton: {
        backgroundColor: '#D32F2F',
    },
    wicketText: {
        color: 'white',
    },
    advancedButton: {
        width: '100%',
        aspectRatio: 5,
        backgroundColor: '#2E7D32',
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
    },
    disabledText: {
        color: '#9E9E9E',
    }
});