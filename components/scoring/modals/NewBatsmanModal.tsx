import React, { useState } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView,
    TextInput 
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Team, Player } from '@/types/match';
import { addPlayer } from '@/store/cricket/scoreboardSlice';
import { BatsmanStats } from '@/components/scoring/BatsmanStats';

interface NewBatsmanModalProps {
    visible: boolean;
    onClose: () => void;
    battingTeam: Team;
    currentInnings: {
        currentStrikerId: string | null;
        currentNonStrikerId: string | null;
    };
    onSelectBatsman: (batsmanId: string, position: 'striker' | 'nonStriker') => void;
}

export default function NewBatsmanModal({
    visible,
    onClose,
    battingTeam,
    currentInnings,
    onSelectBatsman
}: NewBatsmanModalProps) {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddNew, setShowAddNew] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);

    const availableBatsmen = battingTeam.players.filter(player => 
        !player.statistics.batting.dismissalInfo &&
        player.id !== currentInnings.currentStrikerId &&
        player.id !== currentInnings.currentNonStrikerId &&
        player.playerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const validateName = (name: string) => {
        if (!name.trim()) {
            setNameError('Player name is required');
            return false;
        }
        if (name.length < 2) {
            setNameError('Name must be at least 2 characters');
            return false;
        }
        if (battingTeam.players.some(p => 
            p.playerName.toLowerCase() === name.toLowerCase().trim()
        )) {
            setNameError('Player already exists');
            return false;
        }
        setNameError(null);
        return true;
    };

    const handleNameChange = (text: string) => {
        setNewPlayerName(text);
        if (nameError) {
            validateName(text);
        }
    };

    const handleAddNewPlayer = () => {
        if (!validateName(newPlayerName)) return;

        const newPlayer: Player = {
            id: `player-${Date.now()}`,
            playerName: newPlayerName.trim(),
            role: 'batsman',
            statistics: {
                batting: {
                    runs: 0,
                    ballsFaced: 0,
                    fours: 0,
                    sixes: 0,
                    dismissalInfo: null,
                    strikeRate: 0
                },
                bowling: {
                    overs: 0,
                    maidens: 0,
                    runsConceded: 0,
                    wickets: 0,
                    economy: 0,
                    ballsInOver: 0
                }
            }
        };

        dispatch(addPlayer({ teamId: battingTeam.id, player: newPlayer }));
        setNewPlayerName('');
        setNameError(null);
        setShowAddNew(false);
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Select New Batsman</Text>

                    {!showAddNew ? (
                        <>
                            <TextInput
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search players..."
                            />

                            <ScrollView style={styles.playerList}>
                                {availableBatsmen.map(player => (
                                    <View key={player.id} style={styles.playerRow}>
                                        <Text style={styles.playerName}>
                                            {player.playerName}
                                        </Text>
                                        <BatsmanStats
                                            runs={player.statistics.batting.runs}
                                            balls={player.statistics.batting.ballsFaced}
                                            fours={player.statistics.batting.fours}
                                            sixes={player.statistics.batting.sixes}
                                        />
                                        <View style={styles.positionButtons}>
                                            <TouchableOpacity
                                                style={[styles.positionButton, styles.strikerButton]}
                                                onPress={() => onSelectBatsman(player.id, 'striker')}
                                            >
                                                <Text style={styles.buttonText}>Striker</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.positionButton, styles.nonStrikerButton]}
                                                onPress={() => onSelectBatsman(player.id, 'nonStriker')}
                                            >
                                                <Text style={styles.buttonText}>Non-Striker</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            <TouchableOpacity 
                                style={styles.addNewButton}
                                onPress={() => setShowAddNew(true)}
                            >
                                <Text style={styles.addNewButtonText}>Add New Player</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.addNewContainer}>
                            <TextInput
                                style={[
                                    styles.nameInput,
                                    nameError && styles.inputError
                                ]}
                                value={newPlayerName}
                                onChangeText={handleNameChange}
                                placeholder="Enter player name"
                                autoFocus
                            />
                            {nameError && (
                                <Text style={styles.errorText}>{nameError}</Text>
                            )}
                            <View style={styles.addNewActions}>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => setShowAddNew(false)}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.addButton]}
                                    onPress={handleAddNewPlayer}
                                >
                                    <Text style={styles.buttonText}>Add Player</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={onClose}
                    >
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '80%'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10
    },
    playerList: {
        maxHeight: 400
    },
    playerRow: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    playerName: {
        fontSize: 16,
        marginBottom: 5
    },
    positionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    positionButton: {
        backgroundColor: '#1B5E20',
        padding: 8,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5
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
    addNewButton: {
        backgroundColor: '#1B5E20',
        padding: 12,
        borderRadius: 5,
        marginTop: 10
    },
    addNewButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16
    },
    addNewContainer: {
        padding: 15
    },
    nameInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        fontSize: 16,
        marginBottom: 15
    },
    addNewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        marginHorizontal: 5
    },
    cancelButton: {
        backgroundColor: '#757575'
    },
    addButton: {
        backgroundColor: '#1B5E20'
    },
    strikerButton: {
        backgroundColor: '#1B5E20'
    },
    nonStrikerButton: {
        backgroundColor: '#2E7D32'
    },
    inputError: {
        borderColor: '#FF0000',
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 4,
    },
});