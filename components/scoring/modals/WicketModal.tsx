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
import { Team } from '@/types';
import { Dropdown } from 'react-native-element-dropdown';
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
        nextBatsmanId: string;
    }) => void;
    battingTeam: Team;
    bowlingTeam: Team;
    currentStrikerId: string;
    currentNonStrikerId: string;
    battingTeamKey: 'teamA' | 'teamB';
    currentBowlerId?: string;
}

export default function WicketModal({
    visible,
    onClose,
    onConfirm,
    battingTeam,
    bowlingTeam,
    currentStrikerId,
    currentNonStrikerId,
    battingTeamKey,
    currentBowlerId
}: WicketModalProps) {
    const dispatch = useDispatch();

    const [wicketType, setWicketType] = useState('bowled');
    const [outBatsmanId, setOutBatsmanId] = useState(currentStrikerId);
    const [fielderId, setFielderId] = useState<string | undefined>(undefined);
    const [fielderName, setFielderName] = useState('');
    const [nextBatsmanId, setNextBatsmanId] = useState<string | undefined>(undefined);
    const [newBatsmanName, setNewBatsmanName] = useState('');
    const [isFocus, setIsFocus] = useState(false);

    const wicketTypes = [
        'bowled',
        'caught',
        'caught & bowled',
        'lbw',
        'run out',
        'stumped',
        'hit wicket',
        'retired hurt',
        'retired out',
        'timed out',
        'handled the ball',
        'obstructing the field',
        'hit the ball twice',
    ];

    // Mapped data for <Dropdown>
    const wicketTypeData = wicketTypes.map(type => ({
        label: type,
        value: type
    }));

    // Reset each time the modal opens
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

    // If user picks “caught & bowled,” set the fielder to current bowler automatically
    useEffect(() => {
        if (wicketType === 'caught & bowled' && currentBowlerId) {
            // We want the fielder to be the current bowler
            setFielderId(currentBowlerId);
            setFielderName('');
        }
    }, [wicketType, currentBowlerId]);

    const getFielderLabel = () => {
        switch (wicketType) {
            case 'caught': return 'Caught by';
            case 'stumped': return 'Stumped by';
            case 'run out': return 'Run out by';
            default: return '';
        }
    };

    // The out-batsman can only be the current striker or non-striker
    const batsmenData = [
        {
            label: battingTeam.players.find(p => p.id === currentStrikerId)?.name || 'Striker',
            value: currentStrikerId
        },
        {
            label: battingTeam.players.find(p => p.id === currentNonStrikerId)?.name || 'Non-striker',
            value: currentNonStrikerId
        }
    ];
    // Next batsmen are those who are not out, not retired, and not currently on strike
    const availableBatsmen = battingTeam.players.filter(
        player =>
            !player.isOut &&
            !player.isRetired &&
            player.id !== currentStrikerId &&
            player.id !== currentNonStrikerId
    );

    const nextBatsmenData = availableBatsmen.map(p => ({
        label: p.name,
        value: p.id
    }));

    // Fielder can be any bowler team player or a custom name
    const fielderData = [
        { label: 'Select fielder', value: '' },
        ...bowlingTeam.players.map(p => ({
            label: p.name,
            value: p.id
        }))
    ];

    // Final step: confirm the wicket
    const handleConfirm = () => {
        // 1) If new batsman name is provided, create the new player on the fly
        let finalNextBatsmanId = nextBatsmanId;
        if (newBatsmanName.trim() && !finalNextBatsmanId) {
            const newId = uuidv4();

            dispatch(addPlayer({
                team: battingTeamKey,
                player: createCricketer(newId, newBatsmanName.trim())
            }));

            finalNextBatsmanId = newId;
        }

        // 2) If custom fielder name is provided, create new fielder on the fly
        let finalFielderId = fielderId;
        if (fielderName.trim() && !finalFielderId && needsFielder) {
            const newFielderId = uuidv4();

            // Determine bowling team key (opposite of batting team)
            const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';

            dispatch(addPlayer({
                team: bowlingTeamKey,
                player: createCricketer(newFielderId, fielderName.trim())
            }));

            finalFielderId = newFielderId;
        }

        // 3) Basic validations
        if (!outBatsmanId || (!finalNextBatsmanId && !newBatsmanName.trim())) {
            return; // Must pick or create a next batsman
        }
        if (needsFielder && !finalFielderId && !fielderName.trim()) {
            return; // Must pick or provide a fielder
        }

        // 4) Pass everything up so the parent can dispatch properly
        onConfirm({
            wicketType,
            outBatsmanId,
            fielderId: finalFielderId,
            nextBatsmanId: finalNextBatsmanId || ''
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Wicket Details</Text>

                    <ScrollView style={styles.formContainer}>
                        {/* Out Batsman */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Who is out?</Text>
                            <Dropdown
                                style={[styles.dropdown, isFocus && { borderColor: '#D32F2F' }]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={batsmenData}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder="Select batsman"
                                value={outBatsmanId}
                                onFocus={() => setIsFocus(true)}
                                onBlur={() => setIsFocus(false)}
                                onChange={item => {
                                    setOutBatsmanId(item.value);
                                    setIsFocus(false);
                                }}
                            />
                        </View>

                        {/* Wicket Type */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How was the batsman dismissed?</Text>
                            <Dropdown
                                style={[styles.dropdown, isFocus && { borderColor: '#D32F2F' }]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={wicketTypeData}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder="Select wicket type"
                                value={wicketType}
                                onFocus={() => setIsFocus(true)}
                                onBlur={() => setIsFocus(false)}
                                onChange={item => {
                                    setWicketType(item.value);
                                    setIsFocus(false);
                                }}
                            />
                        </View>

                        {/* Fielder (if needed) */}
                        {needsFielder && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{getFielderLabel()}</Text>
                                <Dropdown
                                    style={[styles.dropdown, isFocus && { borderColor: '#D32F2F' }]}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={fielderData}
                                    maxHeight={300}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select fielder"
                                    value={fielderId || ''}
                                    onFocus={() => setIsFocus(true)}
                                    onBlur={() => setIsFocus(false)}
                                    onChange={item => {
                                        if (item.value) {
                                            setFielderId(item.value);
                                            setFielderName('');
                                        }
                                        setIsFocus(false);
                                    }}
                                />

                                <Text style={styles.orText}>OR</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter fielder name"
                                    value={fielderName}
                                    onChangeText={text => {
                                        setFielderName(text);
                                        setFielderId(undefined);
                                    }}
                                />
                            </View>
                        )}

                        {/* Next Batsman */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select next batsman</Text>
                            {availableBatsmen.length > 0 ? (
                                <Dropdown
                                    style={[styles.dropdown, isFocus && { borderColor: '#D32F2F' }]}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={nextBatsmenData}
                                    maxHeight={300}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select next batsman"
                                    value={nextBatsmanId}
                                    onFocus={() => setIsFocus(true)}
                                    onBlur={() => setIsFocus(false)}
                                    onChange={item => {
                                        setNextBatsmanId(item.value);
                                        setNewBatsmanName(''); // Clear new name if a dropdown option is chosen
                                        setIsFocus(false);
                                    }}
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
                                    onChangeText={text => {
                                        setNewBatsmanName(text);
                                        if (text.trim()) {
                                            setNextBatsmanId(undefined);
                                        }
                                    }}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Modal Buttons */}
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
                            disabled={
                                (!nextBatsmanId && !newBatsmanName.trim()) ||
                                (needsFielder && !fielderId && !fielderName)
                            }
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
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#888',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#000',
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
        height: 50,
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