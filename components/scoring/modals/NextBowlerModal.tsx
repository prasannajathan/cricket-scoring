import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput
} from 'react-native';
// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { Team, Cricketer } from '@/types';
import { getMatchRules } from '@/constants/scoring';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addPlayer } from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';

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
    const dispatch = useDispatch();
    const scoreboard = useSelector((state: RootState) => state.scoreboard);
    const rules = getMatchRules(scoreboard);

    const { teamA } = scoreboard;

    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');

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

    const handleAddPlayer = () => {
        if (!newPlayerName.trim()) return;
        const strikerId = uuidv4();
        dispatch(addPlayer({
            team: bowlingTeam.id === teamA.id ? 'teamA' : 'teamB',
            player: createCricketer(strikerId, newPlayerName.trim())
        }));

        setNewPlayerName('');
        setShowAddPlayer(false);
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Select Next Bowler</Text>

                    {!showAddPlayer ? (
                        <>
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

                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowAddPlayer(true)}
                            >
                                <Text style={styles.addButtonText}>Add New Player</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.addPlayerContainer}>
                            <TextInput
                                style={styles.input}
                                value={newPlayerName}
                                onChangeText={setNewPlayerName}
                                placeholder="Enter player name"
                                autoFocus
                            />
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => setShowAddPlayer(false)}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.addButton]}
                                    onPress={handleAddPlayer}
                                >
                                    <Text style={styles.buttonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

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
    },
    addButton: {
        backgroundColor: '#1B5E20',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    addPlayerContainer: {
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    cancelButton: {
        backgroundColor: '#757575',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    }
});