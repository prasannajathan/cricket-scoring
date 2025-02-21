import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Team } from '@/types';
import { getMatchRules } from '@/constants/scoring';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface NextBowlerModalProps {
    visible: boolean;
    onClose: () => void;
    bowlingTeam: Team;
    currentBowlerId?: string;
    lastOverBowlerId?: string;
    onSelectBowler: (bowlerId: string) => void;
}

export default function NextBowlerModal({
    visible,
    onClose,
    bowlingTeam,
    currentBowlerId,
    lastOverBowlerId,
    onSelectBowler
}: NextBowlerModalProps) {
    const state = useSelector((state: RootState) => state.scoreboard);
    const rules = getMatchRules(state);

    const canBowl = (bowlerId: string) => {
        const bowler = bowlingTeam.players.find(p => p.id === bowlerId);
        if (!bowler) return false;

        return bowlerId !== lastOverBowlerId && 
               bowler.overs < rules.MAX_OVERS_PER_BOWLER;
    };

    const getBowlerStatus = (player: any) => {
        if (player.id === lastOverBowlerId) {
            return 'Bowled last over';
        }
        if (player.overs >= rules.MAX_OVERS_PER_BOWLER) {
            return 'Quota complete';
        }
        return `${player.overs}-${player.runsConceded}-${player.wickets}`;
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Select Next Bowler</Text>
                    <ScrollView style={styles.bowlerList}>
                        {bowlingTeam.players.map(player => (
                            <TouchableOpacity
                                key={player.id}
                                style={[
                                    styles.bowlerButton,
                                    !canBowl(player.id) && styles.disabledButton
                                ]}
                                onPress={() => {
                                    if (canBowl(player.id)) {
                                        onSelectBowler(player.id);
                                        onClose();
                                    }
                                }}
                                disabled={!canBowl(player.id)}
                            >
                                <View>
                                    <Text style={styles.bowlerName}>{player.name}</Text>
                                    <Text style={[
                                        styles.bowlerStatus,
                                        !canBowl(player.id) && styles.disabledText
                                    ]}>
                                        {getBowlerStatus(player)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    bowlerList: {
        maxHeight: '70%',
    },
    bowlerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    disabledButton: {
        opacity: 0.5,
    },
    bowlerName: {
        fontSize: 16,
        fontWeight: '500',
    },
    bowlerStats: {
        fontSize: 14,
        color: '#666',
    },
    closeButton: {
        backgroundColor: '#757575',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    bowlerStatus: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    disabledText: {
        color: '#999',
    }
});