import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface AdvancedScoringModalProps {
    visible: boolean;
    onClose: () => void;
    onScore: (runs: number) => void;
}

export default function AdvancedScoringModal({
    visible,
    onClose,
    onScore
}: AdvancedScoringModalProps) {
    const [runs, setRuns] = useState('');

    const handleSubmit = () => {
        const runsValue = parseInt(runs);
        if (!isNaN(runsValue)) {
            onScore(runsValue);
            setRuns('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Advanced Scoring</Text>
                    
                    <TextInput
                        style={styles.input}
                        value={runs}
                        onChangeText={setRuns}
                        keyboardType="number-pad"
                        placeholder="Enter runs"
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, styles.scoreButton]} 
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>Score</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        width: '80%',
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#757575',
    },
    scoreButton: {
        backgroundColor: '#1B5E20',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    }
});