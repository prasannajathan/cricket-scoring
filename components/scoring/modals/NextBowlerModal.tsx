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
import { FontAwesome } from '@expo/vector-icons';
// Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { Team, Cricketer } from '@/types';
import { getMatchRules } from '@/constants/scoring';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addPlayer } from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

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
            <View style={styles.overlay}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                <FontAwesome name="dot-circle-o" size={18} color={colors.brandGreen} style={styles.titleIcon} />
                                {' Select Next Bowler'}
                            </Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <FontAwesome name="times" size={20} color={colors.ccc} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.bowlerList}>
                            {bowlingTeam.players.map(player => {
                                const isCurrentBowler = player.id === currentBowlerId;
                                const isCanBowl = canBowl(player.id);
                                const status = getBowlerStatus(player);
                                
                                return (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={[
                                            styles.bowlerButton,
                                            isCurrentBowler && styles.selectedButton,
                                            !isCanBowl && styles.disabledButton
                                        ]}
                                        onPress={() => {
                                            if (isCanBowl) {
                                                onSelectBowler(player.id);
                                                onClose();
                                            }
                                        }}
                                        disabled={!isCanBowl}
                                        activeOpacity={isCanBowl ? 0.7 : 1}
                                    >
                                        <View style={styles.bowlerInfo}>
                                            <View style={styles.nameContainer}>
                                                <FontAwesome 
                                                    name="user-circle" 
                                                    size={18} 
                                                    color={isCurrentBowler ? colors.brandGreen : isCanBowl ? colors.brandBlue : colors.ccc} 
                                                    style={styles.bowlerIcon} 
                                                />
                                                <Text style={[
                                                    styles.bowlerName,
                                                    isCurrentBowler && styles.selectedText,
                                                    !isCanBowl && styles.disabledText
                                                ]}>
                                                    {player.name}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.statusContainer}>
                                                {player.id === lastOverBowlerId && (
                                                    <View style={styles.statusBadge}>
                                                        <FontAwesome name="history" size={12} color={colors.white} style={styles.statusIcon} />
                                                        <Text style={styles.statusBadgeText}>Last Over</Text>
                                                    </View>
                                                )}
                                                
                                                {player.overs >= rules.MAX_OVERS_PER_BOWLER && (
                                                    <View style={[styles.statusBadge, styles.quotaBadge]}>
                                                        <FontAwesome name="ban" size={12} color={colors.white} style={styles.statusIcon} />
                                                        <Text style={styles.statusBadgeText}>Quota Full</Text>
                                                    </View>
                                                )}
                                            </View>
                                            
                                            <View style={styles.statsContainer}>
                                                {player.overs > 0 && (
                                                    <>
                                                        <View style={styles.statItem}>
                                                            <Text style={styles.statLabel}>O</Text>
                                                            <Text style={[
                                                                styles.statValue,
                                                                !isCanBowl && styles.disabledText
                                                            ]}>
                                                                {player.overs}.{player.ballsThisOver}
                                                            </Text>
                                                        </View>
                                                        
                                                        <View style={styles.statItem}>
                                                            <Text style={styles.statLabel}>R</Text>
                                                            <Text style={[
                                                                styles.statValue,
                                                                !isCanBowl && styles.disabledText
                                                            ]}>
                                                                {player.runsConceded}
                                                            </Text>
                                                        </View>
                                                        
                                                        <View style={styles.statItem}>
                                                            <Text style={styles.statLabel}>W</Text>
                                                            <Text style={[
                                                                styles.statValue,
                                                                player.wickets > 0 && styles.wicketsText,
                                                                !isCanBowl && styles.disabledText
                                                            ]}>
                                                                {player.wickets}
                                                            </Text>
                                                        </View>
                                                        
                                                        {player.overs > 0 && (
                                                            <View style={styles.statItem}>
                                                                <Text style={styles.statLabel}>Econ</Text>
                                                                <Text style={[
                                                                    styles.statValue,
                                                                    !isCanBowl && styles.disabledText
                                                                ]}>
                                                                    {(player.runsConceded / Math.max(player.overs, 0.1)).toFixed(1)}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {player.overs === 0 && (
                                                    <Text style={[
                                                        styles.newBowlerText,
                                                        !isCanBowl && styles.disabledText
                                                    ]}>
                                                        Yet to bowl
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        
                                        {isCanBowl && (
                                            <FontAwesome 
                                                name="angle-right" 
                                                size={20} 
                                                color={colors.brandBlue} 
                                                style={styles.arrowIcon} 
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.addPlayerContainer}>
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>Add New Bowler</Text>
                                <View style={styles.divider} />
                            </View>
                            
                            <View style={styles.inputContainer}>
                                <FontAwesome name="user-plus" size={16} color={colors.ccc} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={newPlayerName}
                                    onChangeText={setNewPlayerName}
                                    placeholder="Enter new bowler name"
                                    placeholderTextColor={colors.ccc}
                                    returnKeyType="done"
                                    onSubmitEditing={handleAddPlayer}
                                />
                            </View>
                            
                            <TouchableOpacity
                                style={[
                                    styles.addButton,
                                    !newPlayerName.trim() && styles.disabledAddButton
                                ]}
                                onPress={handleAddPlayer}
                                disabled={!newPlayerName.trim()}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="plus" size={16} color={colors.white} style={styles.addButtonIcon} />
                                <Text style={styles.addButtonText}>Add & Select</Text>
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
    bowlerList: {
        maxHeight: '60%',
        paddingVertical: spacing.xs,
    },
    bowlerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
    },
    bowlerInfo: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    bowlerIcon: {
        marginRight: spacing.xs,
    },
    selectedButton: {
        backgroundColor: colors.brandGreen + '10', // 10% opacity
        borderLeftWidth: 3,
        borderLeftColor: colors.brandGreen,
    },
    disabledButton: {
        opacity: 0.8,
        backgroundColor: colors.white,
    },
    bowlerName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.brandDark,
    },
    selectedText: {
        color: colors.brandGreen,
        fontWeight: '700',
    },
    disabledText: {
        color: colors.ccc,
    },
    statusContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.orange + '90', // 90% opacity
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: radius.xl,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    quotaBadge: {
        backgroundColor: colors.brandRed + '90', // 90% opacity
    },
    statusIcon: {
        marginRight: spacing.xs / 2,
    },
    statusBadgeText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        marginRight: spacing.md,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: colors.brandDark + '80', // 80% opacity
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.brandDark,
    },
    wicketsText: {
        color: colors.brandGreen,
        fontWeight: '700',
    },
    newBowlerText: {
        fontSize: 13,
        color: colors.brandBlue,
        fontStyle: 'italic',
    },
    arrowIcon: {
        marginLeft: spacing.sm,
    },
    addPlayerContainer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.brandLight,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.brandLight,
    },
    dividerText: {
        paddingHorizontal: spacing.md,
        fontSize: 14,
        fontWeight: '500',
        color: colors.brandBlue,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.brandLight,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        backgroundColor: colors.white,
        ...shadows.subtle,
    },
    inputIcon: {
        marginHorizontal: spacing.md,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 15,
        color: colors.brandDark,
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: colors.brandGreen,
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.button,
    },
    disabledAddButton: {
        backgroundColor: colors.brandLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    addButtonIcon: {
        marginRight: spacing.sm,
    },
    addButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    }
});