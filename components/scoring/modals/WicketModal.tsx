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
    Platform,
    Alert
} from 'react-native';
import { Team } from '@/types';
import { Dropdown } from 'react-native-element-dropdown';
import { useDispatch } from 'react-redux';
import { addPlayer } from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { wicketTypes } from '@/constants/scoring';

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
    totalPlayers: number;
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
    currentBowlerId,
    totalPlayers,
}: WicketModalProps) {
    const dispatch = useDispatch();

    const [wicketType, setWicketType] = useState('bowled');
    const [outBatsmanId, setOutBatsmanId] = useState(currentStrikerId);
    const [fielderId, setFielderId] = useState<string | undefined>(undefined);
    const [fielderName, setFielderName] = useState('');
    const [nextBatsmanId, setNextBatsmanId] = useState<string | undefined>(undefined);
    const [newBatsmanName, setNewBatsmanName] = useState('');
    const [isFocus, setIsFocus] = useState(false);

    // Calculate all out status:
    // 1. Count currently out players
    const outPlayers = battingTeam.players.filter(p => p.isOut || p.isRetired).length;
    
    // 2. Calculate max wickets allowed (based on totalPlayers)
    const maxWickets = totalPlayers - 1;
    
    // 3. Check if this wicket will cause all out
    const nextWicketAllOut = outPlayers + 1 >= maxWickets;

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

    // If user picks "caught & bowled," set the fielder to current bowler automatically
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

    // Function to get wicket type icon
    const getWicketTypeIcon = (type: string) => {
        switch (type) {
            case 'bowled': return 'stumbleupon';
            case 'caught': return 'hand-paper-o';
            case 'caught & bowled': return 'hand-paper-o';
            case 'lbw': return 'ban';
            case 'run out': return 'exchange';
            case 'stumped': return 'hand-pointer-o';
            case 'hit wicket': return 'arrow-left';
            case 'retired hurt': return 'medkit';
            case 'retired out': return 'sign-out';
            default: return 'times-circle';
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
        // Check if we need a fielder but don't have one
        if (needsFielder && !fielderId && !fielderName.trim()) {
            Alert.alert('Missing Fielder', 'Please select or enter a fielder name.');
            return;
        }
        
        // If this wicket will cause all out, show confirmation
        if (nextWicketAllOut) {
            Alert.alert(
                'Team All Out',
                'This wicket will result in the team being all out. The innings will end.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Continue', 
                        onPress: () => {
                            // 1) Handle custom fielder if needed
                            let finalFielderId = fielderId;
                            if (fielderName.trim() && !finalFielderId && needsFielder) {
                                const newFielderId = uuidv4();
                                const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
                                dispatch(addPlayer({
                                    team: bowlingTeamKey,
                                    player: createCricketer(newFielderId, fielderName.trim())
                                }));
                                finalFielderId = newFielderId;
                            }
                            
                            // 2) Submit with empty nextBatsmanId to signal all out
                            onConfirm({
                                wicketType,
                                outBatsmanId,
                                fielderId: finalFielderId,
                                nextBatsmanId: ''  // Empty string signals all out when combined with nextWicketAllOut
                            });
                        }
                    }
                ]
            );
            return;
        }
        
        // Regular case - not all out
        
        // 1) If new batsman name is provided, create the new player
        let finalNextBatsmanId = nextBatsmanId;
        if (newBatsmanName.trim() && !finalNextBatsmanId) {
            const newId = uuidv4();
            dispatch(addPlayer({
                team: battingTeamKey,
                player: createCricketer(newId, newBatsmanName.trim())
            }));
            finalNextBatsmanId = newId;
        }

        // 2) If custom fielder name is provided, create new fielder
        let finalFielderId = fielderId;
        if (fielderName.trim() && !finalFielderId && needsFielder) {
            const newFielderId = uuidv4();
            const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
            dispatch(addPlayer({
                team: bowlingTeamKey,
                player: createCricketer(newFielderId, fielderName.trim())
            }));
            finalFielderId = newFielderId;
        }

        // 3) Basic validations for non-all-out case
        if (!outBatsmanId) {
            Alert.alert('Error', 'Please select which batsman is out.');
            return;
        }
        
        if (!finalNextBatsmanId && !newBatsmanName.trim()) {
            Alert.alert('Error', 'Please select or enter a name for the next batsman.');
            return;
        }

        // 4) Submit the wicket
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
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {/* <FontAwesome name="stumbleupon" size={20} color={colors.brandRed} style={styles.titleIcon} /> */}
                                {' Wicket Details'}
                            </Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <FontAwesome name="times" size={20} color={colors.ccc} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            {/* Out Batsman */}
                            <View style={styles.section}>
                                <View style={styles.sectionTitleRow}>
                                    <FontAwesome name="user" size={16} color={colors.brandBlue} style={styles.sectionIcon} />
                                    <Text style={styles.sectionTitle}>Who is out?</Text>
                                </View>
                                <Dropdown
                                    style={[styles.dropdown, isFocus && styles.dropdownFocus]}
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
                                    // renderLeftIcon={() => (
                                    //     <FontAwesome 
                                    //         name="user-circle" 
                                    //         size={16} 
                                    //         color={colors.brandBlue} 
                                    //         style={styles.dropdownIcon}
                                    //     />
                                    // )}
                                />
                            </View>

                            {/* Wicket Type */}
                            <View style={styles.section}>
                                <View style={styles.sectionTitleRow}>
                                    <FontAwesome name={getWicketTypeIcon(wicketType)} size={16} color={colors.brandRed} style={styles.sectionIcon} />
                                    <Text style={styles.sectionTitle}>How was the batsman dismissed?</Text>
                                </View>
                                <Dropdown
                                    style={[styles.dropdown, isFocus && styles.dropdownFocus]}
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
                                    // renderLeftIcon={() => (
                                    //     <FontAwesome 
                                    //         name={getWicketTypeIcon(wicketType)} 
                                    //         size={16} 
                                    //         color={colors.brandRed} 
                                    //         style={styles.dropdownIcon}
                                    //     />
                                    // )}
                                />
                            </View>

                            {/* Fielder (if needed) */}
                            {needsFielder && (
                                <View style={styles.section}>
                                    <View style={styles.sectionTitleRow}>
                                        <FontAwesome name="hand-paper-o" size={16} color={colors.brandGreen} style={styles.sectionIcon} />
                                        <Text style={styles.sectionTitle}>{getFielderLabel()}</Text>
                                    </View>
                                    <Dropdown
                                        style={[styles.dropdown, isFocus && styles.dropdownFocus]}
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
                                        // renderLeftIcon={() => (
                                        //     <FontAwesome 
                                        //         name="user-circle" 
                                        //         size={16} 
                                        //         color={colors.brandGreen} 
                                        //         style={styles.dropdownIcon}
                                        //     />
                                        // )}
                                    />

                                    <View style={styles.orContainer}>
                                        <View style={styles.divider} />
                                        <Text style={styles.orText}>OR</Text>
                                        <View style={styles.divider} />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <FontAwesome name="plus-circle" size={16} color={colors.ccc} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter new fielder name"
                                            value={fielderName}
                                            onChangeText={text => {
                                                setFielderName(text);
                                                setFielderId(undefined);
                                            }}
                                            placeholderTextColor={colors.bitDarkGrey}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Next Batsman */}
                            <View style={styles.section}>
                                <View style={styles.sectionTitleRow}>
                                    <FontAwesome name="exchange" size={16} color={colors.brandBlue} style={styles.sectionIcon} />
                                    <Text style={styles.sectionTitle}>Select next batsman</Text>
                                </View>

                                {nextWicketAllOut ? (
                                    <View style={styles.allOutContainer}>
                                        <FontAwesome name="exclamation-triangle" size={18} color={colors.brandRed} style={styles.allOutIcon} />
                                        <Text style={styles.allOutText}>
                                            This wicket will cause the team to be all out. No next batsman needed.
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {availableBatsmen.length > 0 ? (
                                            <Dropdown
                                                style={[styles.dropdown, isFocus && styles.dropdownFocus]}
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
                                                // renderLeftIcon={() => (
                                                //     <FontAwesome 
                                                //         name="user-circle" 
                                                //         size={16} 
                                                //         color={colors.brandBlue} 
                                                //         style={styles.dropdownIcon}
                                                //     />
                                                // )}
                                            />
                                        ) : (
                                            <View style={styles.noPlayersContainer}>
                                                <FontAwesome name="info-circle" size={16} color={colors.brandBlue} style={styles.noPlayersIcon} />
                                                <Text style={styles.noPlayersText}>No available batsmen - add a new player</Text>
                                            </View>
                                        )}

                                        <View style={styles.orContainer}>
                                            <View style={styles.divider} />
                                            <Text style={styles.orText}>OR</Text>
                                            <View style={styles.divider} />
                                        </View>

                                        <View style={styles.inputContainer}>
                                            <FontAwesome name="plus-circle" size={16} color={colors.ccc} style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter new batsman name"
                                                value={newBatsmanName}
                                                onChangeText={text => {
                                                    setNewBatsmanName(text);
                                                    if (text.trim()) {
                                                        setNextBatsmanId(undefined);
                                                    }
                                                }}
                                                placeholderTextColor={colors.bitDarkGrey}
                                            />
                                        </View>
                                    </>
                                )}
                            </View>
                        </ScrollView>

                        {/* Modal Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="times" size={16} color={colors.brandDark} style={styles.buttonIcon} />
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.confirmButton,
                                    (!outBatsmanId || 
                                    (needsFielder && !fielderId && !fielderName.trim()) || 
                                    (!nextWicketAllOut && !nextBatsmanId && !newBatsmanName.trim())) 
                                    && styles.disabledButton
                                ]}
                                onPress={handleConfirm}
                                disabled={
                                    !outBatsmanId || 
                                    (needsFielder && !fielderId && !fielderName.trim()) || 
                                    (!nextWicketAllOut && !nextBatsmanId && !newBatsmanName.trim())
                                }
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="check" size={16} color={colors.white} style={styles.buttonIcon} />
                                <Text style={styles.confirmText}>Confirm Wicket</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '93%',
        maxHeight: '90%',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        overflow: 'hidden',
        ...shadows.modal,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
        backgroundColor: colors.white,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.brandDark,
        flex: 1,
    },
    titleIcon: {
        marginRight: spacing.xs,
    },
    closeButton: {
        padding: spacing.xs,
    },
    formContainer: {
        maxHeight: 500,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionIcon: {
        marginRight: spacing.xs,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.brandDark,
    },
    dropdown: {
        height: 50,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.brandLight,
        paddingHorizontal: spacing.md,
        ...shadows.subtle,
    },
    dropdownFocus: {
        borderColor: colors.brandBlue,
    },
    dropdownIcon: {
        marginRight: spacing.md,
    },
    placeholderStyle: {
        fontSize: 15,
        color: colors.ccc,
    },
    selectedTextStyle: {
        fontSize: 15,
        color: colors.brandDark,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.brandLight,
        borderRadius: radius.md,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.md,
        height: 50,
        ...shadows.subtle,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.brandDark,
        height: '100%',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.brandLight,
    },
    orText: {
        marginHorizontal: spacing.md,
        color: colors.brandDark,
        fontWeight: '500',
        fontSize: 14,
    },
    allOutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.brandRed + '10',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.brandRed + '20',
    },
    allOutIcon: {
        marginRight: spacing.sm,
    },
    allOutText: {
        flex: 1,
        fontSize: 14,
        color: colors.brandRed,
        fontWeight: '500',
    },
    noPlayersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.brandLight,
        borderRadius: radius.md,
    },
    noPlayersIcon: {
        marginRight: spacing.sm,
    },
    noPlayersText: {
        flex: 1,
        fontSize: 14,
        fontStyle: 'italic',
        color: colors.brandBlue,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.brandLight,
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        flex: 1,
        marginHorizontal: spacing.xs,
        ...shadows.button,
    },
    buttonIcon: {
        marginRight: spacing.xs,
    },
    cancelButton: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.brandLight,
    },
    confirmButton: {
        backgroundColor: colors.brandRed,
    },
    disabledButton: {
        backgroundColor: colors.brandLight,
        // color: colors.brandDark,
        shadowOpacity: 0,
        elevation: 0,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.brandDark,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.white,
    },
});