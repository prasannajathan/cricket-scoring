import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Team, InningsData } from '@/types';

interface PartnershipModalProps {
    visible: boolean;
    onClose: () => void;
    battingTeam: Team;
    currentInnings: InningsData;
}

export default function PartnershipModal({
    visible,
    onClose,
    battingTeam,
    currentInnings
}: PartnershipModalProps) {
    const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
    const nonStriker = battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId);

    // Get partnership data from the innings
    const partnership = currentInnings.currentPartnership || {
        runs: 0,
        balls: 0
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Current Partnership</Text>
                    <Text style={styles.partnershipText}>
                        {`${partnership.runs} runs from ${partnership.balls} balls`}
                    </Text>
                    <Text style={styles.runRate}>
                        {`Run Rate: ${partnership.balls > 0 ? ((partnership.runs / partnership.balls) * 6).toFixed(2) : '0.00'}`}
                    </Text>
                    
                    <View style={styles.playerDetails}>
                        {striker && (
                            <Text style={styles.playerText}>
                                {`${striker.name}: ${striker.runs}(${striker.balls})`}
                            </Text>
                        )}
                        {nonStriker && (
                            <Text style={styles.playerText}>
                                {`${nonStriker.name}: ${nonStriker.runs}(${nonStriker.balls})`}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
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
    partnershipText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1B5E20',
        textAlign: 'center',
        marginBottom: 8,
    },
    runRate: {
        fontSize: 16,
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 16,
    },
    playerDetails: {
        marginBottom: 16,
    },
    playerText: {
        fontSize: 14,
        marginBottom: 8,
    },
    closeButton: {
        backgroundColor: '#1B5E20',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    }
});