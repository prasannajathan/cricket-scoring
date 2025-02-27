import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectCurrentInnings } from '@/store/cricket/selectors';

interface ExtrasModalProps {
    visible: boolean;
    onClose: () => void;
    onAddExtras: (runs: number) => void;
}

export default function ExtrasModal({ visible, onClose, onAddExtras }: ExtrasModalProps) {
    const [extraRuns, setExtraRuns] = useState('');
    const currentInnings = useSelector(selectCurrentInnings);
    
    // Calculate extras by type using the deliveries array
    const extrasBreakdown = useMemo(() => {
        if (!currentInnings?.deliveries) return { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 };
        
        return currentInnings.deliveries.reduce((acc, delivery) => {
            if (delivery.extraType === 'wide') {
                acc.wides += (1 + delivery.runs)
            } else if (delivery.extraType === 'no-ball') {
                acc.noBalls += 1 + Math.max(0, delivery.runs - delivery.batsmanRuns);
            } else if (delivery.extraType === 'bye') {
                acc.byes += delivery.runs;
            } else if (delivery.extraType === 'leg-bye') {
                acc.legByes += delivery.runs;
            } else if (delivery.extraType === 'penalty') {
                acc.penalties += delivery.runs;
            }
            return acc;
        }, { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 });
    }, [currentInnings?.deliveries]);
    
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
                    <Text style={styles.title}>Extras</Text>
                    
                    <View style={styles.extrasContainer}>
                        <View style={styles.extrasSummary}>
                            <Text style={styles.totalExtrasText}>
                                Total Extras: {currentInnings?.extras || 0} runs
                            </Text>
                        </View>
                        
                        <View style={styles.detailsContainer}>
                            <View style={styles.extrasRow}>
                                <Text style={styles.extrasLabel}>Wide Balls:</Text>
                                <Text style={styles.extrasValue}>{extrasBreakdown.wides}</Text>
                            </View>
                            
                            <View style={styles.extrasRow}>
                                <Text style={styles.extrasLabel}>No Balls:</Text>
                                <Text style={styles.extrasValue}>{extrasBreakdown.noBalls}</Text>
                            </View>
                            
                            <View style={styles.extrasRow}>
                                <Text style={styles.extrasLabel}>Byes:</Text>
                                <Text style={styles.extrasValue}>{extrasBreakdown.byes}</Text>
                            </View>
                            
                            <View style={styles.extrasRow}>
                                <Text style={styles.extrasLabel}>Leg Byes:</Text>
                                <Text style={styles.extrasValue}>{extrasBreakdown.legByes}</Text>
                            </View>
                            
                            <View style={styles.extrasRow}>
                                <Text style={styles.extrasLabel}>Penalties:</Text>
                                <Text style={styles.extrasValue}>{extrasBreakdown.penalties}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        <Text style={styles.addExtraTitle}>Add Extra Runs</Text>
                        <TextInput
                            style={styles.input}
                            value={extraRuns}
                            onChangeText={setExtraRuns}
                            keyboardType="number-pad"
                            placeholder="Enter runs"
                        />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, styles.addButton]} 
                            onPress={handleSubmit}
                            disabled={!extraRuns.trim()}
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
        width: '90%',
        maxHeight: '80%',
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#1B5E20',
    },
    extrasContainer: {
        marginBottom: 16,
    },
    extrasSummary: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    totalExtrasText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1B5E20',
    },
    detailsContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
    },
    extrasRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    extrasLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    extrasValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16,
    },
    addExtraTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
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