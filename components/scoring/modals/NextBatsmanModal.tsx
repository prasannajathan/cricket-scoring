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

import { Team } from '@/types';
import { useDispatch } from 'react-redux';
import { addPlayer, setCurrentStriker, setCurrentNonStriker } from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';

interface NextBatsmanModalProps {
    visible: boolean;
    onClose: () => void;
    battingTeam: Team;
    outBatsmanId?: string; 
    isStriker: boolean;
    onSelectBatsman: (batsmanId: string) => void;
}

export default function NextBatsmanModal({
    visible,
    onClose,
    battingTeam,
    outBatsmanId,
    isStriker,
    onSelectBatsman
}: NextBatsmanModalProps) {
    const dispatch = useDispatch();
    const [newPlayerName, setNewPlayerName] = useState('');

    const availableBatsmen = battingTeam.players.filter(
        player => !player.isOut && !player.isRetired && player.id !== outBatsmanId
    );

    const handleAddPlayer = () => {
        if (!newPlayerName.trim()) return;
        
        const newBatsmanId = uuidv4();
        const teamKey = battingTeam.id === 'teamA' ? 'teamA' : 'teamB';
        
        dispatch(addPlayer({
            team: teamKey,
            player: createCricketer(newBatsmanId, newPlayerName.trim())
        }));

        // Select this new batsman
        onSelectBatsman(newBatsmanId);
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
                    <Text style={styles.title}>
                        Select New {isStriker ? 'Striker' : 'Non-Striker'}
                    </Text>
                    
                    <ScrollView style={styles.batsmanList}>
                        {availableBatsmen.map(player => (
                            <TouchableOpacity
                                key={player.id}
                                style={styles.batsmanButton}
                                onPress={() => {
                                    onSelectBatsman(player.id);
                                    onClose();
                                }}
                            >
                                <Text style={styles.batsmanName}>
                                    {player.name}
                                </Text>
                                <Text style={styles.batsmanStats}>
                                    {player.runs || 0}({player.balls || 0})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.addPlayerContainer}>
                        <TextInput
                            style={styles.input}
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            placeholder="New batsman name"
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
    batsmanList: {
        maxHeight: '60%',
    },
    batsmanButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    batsmanName: {
        fontSize: 16,
        fontWeight: '500',
    },
    batsmanStats: {
        fontSize: 12,
        color: '#666',
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