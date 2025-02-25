import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Team } from '@/types/match';
import { BatsmanStats } from '@/components/scoring/BatsmanStats';

interface RetirementModalProps {
    visible: boolean;
    onClose: () => void;
    battingTeam: Team;
    currentStrikerId?: string | null;
    currentNonStrikerId?: string | null;
    onRetire: (batsmanId: string, type: 'hurt' | 'out' | 'tactical') => void;
}

export default function RetirementModal({
    visible,
    onClose,
    battingTeam,
    currentStrikerId,
    currentNonStrikerId,
    onRetire
}: RetirementModalProps) {
    const renderBatsmanOption = (batsmanId: string | null | undefined) => {
        if (!batsmanId) return null;
        const batsman = battingTeam.players.find(p => p.id === batsmanId);
        if (!batsman) return null;

        return (
            <View style={styles.batsmanContainer}>
                <View style={styles.batsmanHeader}>
                    <Text style={styles.batsmanName}>{batsman.playerName}</Text>
                    <BatsmanStats 
                        runs={batsman.statistics.batting.runs}
                        balls={batsman.statistics.batting.ballsFaced}
                        fours={batsman.statistics.batting.fours}
                        sixes={batsman.statistics.batting.sixes}
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.hurtButton]}
                        onPress={() => onRetire(batsmanId, 'hurt')}
                    >
                        <Text style={styles.buttonText}>Retired Hurt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.tacticalButton]}
                        onPress={() => onRetire(batsmanId, 'tactical')}
                    >
                        <Text style={styles.buttonText}>Retired Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Retire Batsman</Text>
                    {renderBatsmanOption(currentStrikerId)}
                    {renderBatsmanOption(currentNonStrikerId)}
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>Cancel</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    batsmanContainer: {
        marginBottom: 20
    },
    batsmanName: {
        fontSize: 16,
        marginBottom: 10
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    button: {
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5
    },
    hurtButton: {
        backgroundColor: '#FF9800'
    },
    tacticalButton: {
        backgroundColor: '#2196F3'
    },
    buttonText: {
        color: 'white',
        textAlign: 'center'
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#757575',
        borderRadius: 5
    },
    closeButtonText: {
        color: 'white',
        textAlign: 'center'
    },
    batsmanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    }
});