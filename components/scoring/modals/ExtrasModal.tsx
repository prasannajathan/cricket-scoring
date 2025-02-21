import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface ExtrasModalProps {
    visible: boolean;
    onClose: () => void;
    onAddExtras: (runs: number) => void;
}

export default function ExtrasModal({ visible, onClose, onAddExtras }: ExtrasModalProps) {
    const [extraRuns, setExtraRuns] = useState('');

    const handleSubmit = () => {
        const runs = parseInt(extraRuns);
        if (!isNaN(runs) && runs > 0) {
            onAddExtras(runs);
            setExtraRuns('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Add Extra Runs</Text>
                    
                    <TextInput
                        style={styles.input}
                        value={extraRuns}
                        onChangeText={setExtraRuns}
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
                            style={[styles.button, styles.addButton]} 
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>Add</Text>
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
    addButton: {
        backgroundColor: '#1B5E20',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    }
});