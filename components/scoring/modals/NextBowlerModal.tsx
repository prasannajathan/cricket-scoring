import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform
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
        
        const newBowlerId = uuidv4();
        const teamKey = bowlingTeam.id === teamA.id ? 'teamA' : 'teamB';
        
        dispatch(addPlayer({
            team: teamKey,
            player: createCricketer(newBowlerId, newPlayerName.trim())
        }));

        // Select this new bowler and close the modal
        onSelectBowler(newBowlerId);
        setNewPlayerName('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContainer}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Select Next Bowler</Text>
                    
                    <ScrollView style={styles.bowlerList}>
                        {bowlingTeam.players.map(player => (
                            <TouchableOpacity
                                key={player.id}
                                style={[
                                    styles.bowlerButton,
                                    player.id === currentBowlerId && styles.selectedButton,
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
                                    <Text style={[
                                        styles.bowlerName,
                                        player.id === currentBowlerId && styles.selectedText
                                    ]}>
                                        {player.name}
                                    </Text>
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

                    <View style={styles.addPlayerContainer}>
                        <TextInput
                            style={styles.input}
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            placeholder="New bowler name"
                            returnKeyType="done"
                            onSubmitEditing={handleAddPlayer}
                        />
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddPlayer}
                            disabled={!newPlayerName.trim()}
                        >
                            <Text style={styles.addButtonText}>Add & Select</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        maxHeight: '60%',
    },
    bowlerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    selectedButton: {
        backgroundColor: '#E8F5E9',
        borderLeftWidth: 3,
        borderLeftColor: '#1B5E20',
    },
    disabledButton: {
        opacity: 0.5,
    },
    bowlerName: {
        fontSize: 16,
        fontWeight: '500',
    },
    selectedText: {
        color: '#1B5E20',
        fontWeight: 'bold',
    },
    bowlerStatus: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    disabledText: {
        color: '#999',
    },
    addPlayerContainer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    addButton: {
        backgroundColor: '#1B5E20',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    }
});