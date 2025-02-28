import React, { useState, useEffect } from 'react';
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
import { Team, Cricketer } from '@/types';
import ModalDropdown from 'react-native-modal-dropdown';
import { useDispatch } from 'react-redux';
import { addPlayer } from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface WicketModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (wicketData: {
        wicketType: string;
        outBatsmanId: string;
        fielderId?: string;
        fielderName?: string;
        nextBatsmanId: string;
    }) => void;
    battingTeam: Team;
    bowlingTeam: Team;
    currentStrikerId: string;
    currentNonStrikerId: string;
    battingTeamKey: 'teamA' | 'teamB';
}

export default function WicketModal({
    visible,
    onClose,
    onConfirm,
    battingTeam,
    bowlingTeam,
    currentStrikerId,
    currentNonStrikerId,
    battingTeamKey
}: WicketModalProps) {
    const dispatch = useDispatch();
    
    const [wicketType, setWicketType] = useState('bowled');
    const [outBatsmanId, setOutBatsmanId] = useState(currentStrikerId);
    const [fielderId, setFielderId] = useState<string | undefined>(undefined);
    const [fielderName, setFielderName] = useState('');
    const [nextBatsmanId, setNextBatsmanId] = useState<string | undefined>(undefined);
    const [newBatsmanName, setNewBatsmanName] = useState('');
    
    const wicketTypes = [
        'bowled',
        'caught',
        'lbw',
        'run out',
        'stumped',
        'hit wicket',
        'retired hurt'
    ];
    
    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            setWicketType('bowled');
            setOutBatsmanId(currentStrikerId);
            setFielderId(undefined);
            setFielderName('');
            setNextBatsmanId(undefined);
            setNewBatsmanName('');
        }
    }, [visible, currentStrikerId]);

    // Reset fielder when wicket type changes
    useEffect(() => {
        setFielderId(undefined);
        setFielderName('');
    }, [wicketType]);

    const needsFielder = wicketType === 'caught' || wicketType === 'run out' || wicketType === 'stumped';
    
    const getFielderLabel = () => {
        switch(wicketType) {
            case 'caught': return 'Caught by';
            case 'stumped': return 'Stumped by';
            case 'run out': return 'Run out by';
            default: return '';
        }
    };

    const availableBatsmen = battingTeam.players.filter(
        player => !player.isOut && 
                 !player.isRetired && 
                 player.id !== currentStrikerId && 
                 player.id !== currentNonStrikerId
    );
    
    const getOutBatsmanName = () => {
        return battingTeam.players.find(p => p.id === outBatsmanId)?.name || 'Batsman';
    };

    const getNextBatsmanName = () => {
        if (!nextBatsmanId) return 'Select next batsman';
        return battingTeam.players.find(p => p.id === nextBatsmanId)?.name || 'Next Batsman';
    };

    const handleConfirm = () => {
        // If a new batsman name is provided, add them first
        let finalNextBatsmanId = nextBatsmanId;
        
        if (newBatsmanName.trim() && !nextBatsmanId) {
            const newId = uuidv4();
            
            dispatch(addPlayer({
                team: battingTeamKey,
                player: createCricketer(newId, newBatsmanName.trim())
            }));
            
            finalNextBatsmanId = newId;
        }
        
        // Validate required inputs
        if (!outBatsmanId || (!finalNextBatsmanId && !newBatsmanName.trim())) return;
        
        // Check if fielder is required but not provided
        if (needsFielder && !fielderId && !fielderName) return;
        
        onConfirm({
            wicketType,
            outBatsmanId,
            fielderId,
            fielderName: fielderName || undefined,
            nextBatsmanId: finalNextBatsmanId || ''
        });
    };

    // Fix for the "key" prop warning - create batsman items directly
    const renderBatsmanItem = (name: string, index: number) => {
        return name;
    };
    
    // Fix for fielder items
    const renderFielderItem = (name: string, index: number) => {
        return name;
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContainer}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Wicket Details</Text>
                    
                    <ScrollView style={styles.formContainer}>
                        {/* OUT BATSMAN SECTION */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Who is out?</Text>
                            <ModalDropdown
                                options={[
                                    battingTeam.players.find(p => p.id === currentStrikerId)?.name || 'Striker',
                                    battingTeam.players.find(p => p.id === currentNonStrikerId)?.name || 'Non-striker'
                                ]}
                                defaultValue={getOutBatsmanName()}
                                onSelect={(index: number) => {
                                    setOutBatsmanId(index === 0 ? currentStrikerId : currentNonStrikerId);
                                }}
                                style={styles.dropdown}
                                textStyle={styles.dropdownText}
                                dropdownStyle={styles.dropdownMenu}
                                dropdownTextStyle={styles.dropdownMenuText}
                                renderRow={renderBatsmanItem}
                            />
                        </View>

                        {/* WICKET TYPE SECTION */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How was the batsman dismissed?</Text>
                            <ModalDropdown
                                options={wicketTypes}
                                defaultValue={wicketType}
                                onSelect={(index: number, value: string) => setWicketType(value)}
                                style={styles.dropdown}
                                textStyle={styles.dropdownText}
                                dropdownStyle={styles.dropdownMenu}
                                dropdownTextStyle={styles.dropdownMenuText}
                                renderRow={renderBatsmanItem}
                            />
                        </View>

                        {/* FIELDER SECTION (if needed) */}
                        {needsFielder && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{getFielderLabel()}</Text>
                                <ModalDropdown
                                    options={[
                                        'Select fielder',
                                        ...bowlingTeam.players.map(p => p.name)
                                    ]}
                                    defaultValue="Select fielder"
                                    onSelect={(index: number) => {
                                        if (index > 0) {
                                            setFielderId(bowlingTeam.players[index - 1].id);
                                            setFielderName('');
                                        }
                                    }}
                                    style={styles.dropdown}
                                    textStyle={styles.dropdownText}
                                    dropdownStyle={styles.dropdownMenu}
                                    dropdownTextStyle={styles.dropdownMenuText}
                                    renderRow={renderFielderItem}
                                />
                                
                                <Text style={styles.orText}>OR</Text>
                                
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter fielder name"
                                    value={fielderName}
                                    onChangeText={(text) => {
                                        setFielderName(text);
                                        setFielderId(undefined);
                                    }}
                                />
                            </View>
                        )}

                        {/* NEXT BATSMAN SECTION */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select next batsman</Text>
                            
                            {availableBatsmen.length > 0 ? (
                                <ModalDropdown
                                    options={availableBatsmen.map(p => p.name)}
                                    defaultValue={getNextBatsmanName()}
                                    onSelect={(index: number) => {
                                        setNextBatsmanId(availableBatsmen[index].id);
                                        setNewBatsmanName(''); // Clear new name when selecting from dropdown
                                    }}
                                    style={styles.dropdown}
                                    textStyle={styles.dropdownText}
                                    dropdownStyle={styles.dropdownMenu}
                                    dropdownTextStyle={styles.dropdownMenuText}
                                    renderRow={renderBatsmanItem}
                                />
                            ) : (
                                <Text style={styles.noPlayersText}>No available batsmen</Text>
                            )}
                            
                            <Text style={styles.orText}>OR</Text>
                            
                            <View style={styles.newBatsmanContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="New batsman name"
                                    value={newBatsmanName}
                                    onChangeText={(text) => {
                                        setNewBatsmanName(text);
                                        if (text.trim()) {
                                            setNextBatsmanId(undefined); // Clear selected batsman when typing
                                        }
                                    }}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.button, 
                                styles.confirmButton,
                                ((!nextBatsmanId && !newBatsmanName.trim()) || 
                                (needsFielder && !fielderId && !fielderName)) && styles.disabledButton
                            ]} 
                            onPress={handleConfirm}
                            disabled={(!nextBatsmanId && !newBatsmanName.trim()) || 
                                     (needsFielder && !fielderId && !fielderName)}
                        >
                            <Text style={styles.confirmText}>Confirm</Text>
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
        maxHeight: '85%',
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#D32F2F',
    },
    formContainer: {
        maxHeight: '75%',
    },
    section: {
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 12,
        justifyContent: 'center',
    },
    dropdownText: {
        fontSize: 16,
    },
    dropdownMenu: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        width: '90%',
    },
    dropdownMenuText: {
        fontSize: 16,
        padding: 12,
    },
    orText: {
        textAlign: 'center',
        marginVertical: 8,
        color: '#757575',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 12,
        fontSize: 16,
    },
    newBatsmanContainer: {
        marginTop: 8,
    },
    noPlayersText: {
        padding: 12,
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
        fontStyle: 'italic',
        borderRadius: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#D32F2F',
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
        opacity: 0.7,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
});