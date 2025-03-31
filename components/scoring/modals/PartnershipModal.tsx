import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Team, InningsData } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

interface PartnershipModalProps {
    visible: boolean;
    onClose: () => void;
    battingTeam: Team;
    currentInnings: InningsData;
}

export default function PartnershipModal({
    visible,
    onClose,
    battingTeam,
    currentInnings
}: PartnershipModalProps) {
    const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
    const nonStriker = battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId);

    // Get partnership data from the innings
    const partnership = currentInnings.currentPartnership || {
        runs: 0,
        balls: 0
    };
    
    // Calculate contribution percentages
    const strikerContribution = striker && partnership.runs > 0
        ? Math.round((striker.runs / partnership.runs) * 100)
        : 0;
    
    const nonStrikerContribution = nonStriker && partnership.runs > 0
        ? Math.round((nonStriker.runs / partnership.runs) * 100)
        : 0;
        
    // Calculate run rate
    const runRate = partnership.balls > 0 
        ? ((partnership.runs / partnership.balls) * 6).toFixed(2) 
        : '0.00';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <FontAwesome name="link" size={18} color={colors.brandBlue} style={styles.headerIcon} />
                        <Text style={styles.title}>Current Partnership</Text>
                        <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
                            <FontAwesome name="times" size={20} color={colors.ccc} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.partnershipContainer}>
                        <Text style={styles.partnershipValue}>{partnership.runs}</Text>
                        <Text style={styles.partnershipLabel}>runs</Text>
                        
                        <View style={styles.partnershipDetails}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Balls</Text>
                                <Text style={styles.detailValue}>{partnership.balls}</Text>
                            </View>
                            
                            <View style={styles.detailDivider} />
                            
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Run Rate</Text>
                                <Text style={[
                                    styles.detailValue, 
                                    parseFloat(runRate) > 8 ? styles.highRunRate : null
                                ]}>
                                    {runRate}
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.playerDetailsContainer}>
                        {striker && (
                            <View style={styles.playerCard}>
                                <View style={styles.playerNameRow}>
                                    <FontAwesome name="star" size={14} color={colors.orange} style={styles.playerIcon} />
                                    <Text style={styles.playerName}>{striker.name}</Text>
                                </View>
                                <View style={styles.playerStatsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{striker.runs}</Text>
                                        <Text style={styles.statLabel}>runs</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{striker.balls}</Text>
                                        <Text style={styles.statLabel}>balls</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {striker.balls > 0 
                                                ? ((striker.runs / striker.balls) * 100).toFixed(1) 
                                                : '0.0'}
                                        </Text>
                                        <Text style={styles.statLabel}>SR</Text>
                                    </View>
                                </View>
                                {partnership.runs > 0 && (
                                    <View style={styles.contributionBar}>
                                        <View 
                                            style={[
                                                styles.contributionFill, 
                                                { width: `${strikerContribution}%` }
                                            ]} 
                                        />
                                        <Text style={styles.contributionText}>
                                            {strikerContribution}% contribution
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        
                        {nonStriker && (
                            <View style={styles.playerCard}>
                                <View style={styles.playerNameRow}>
                                    <FontAwesome name="user" size={14} color={colors.brandBlue} style={styles.playerIcon} />
                                    <Text style={styles.playerName}>{nonStriker.name}</Text>
                                </View>
                                <View style={styles.playerStatsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{nonStriker.runs}</Text>
                                        <Text style={styles.statLabel}>runs</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{nonStriker.balls}</Text>
                                        <Text style={styles.statLabel}>balls</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {nonStriker.balls > 0 
                                                ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) 
                                                : '0.0'}
                                        </Text>
                                        <Text style={styles.statLabel}>SR</Text>
                                    </View>
                                </View>
                                {partnership.runs > 0 && (
                                    <View style={styles.contributionBar}>
                                        <View 
                                            style={[
                                                styles.contributionFill, 
                                                styles.nonStrikerContribution,
                                                { width: `${nonStrikerContribution}%` }
                                            ]} 
                                        />
                                        <Text style={styles.contributionText}>
                                            {nonStrikerContribution}% contribution
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <FontAwesome name="check" size={16} color={colors.white} style={styles.buttonIcon} />
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
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        width: '90%',
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
    },
    headerIcon: {
        marginRight: spacing.xs,
    },
    title: {
        flex: 1,
        fontSize: typography.sizeLG,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
        marginLeft: spacing.xs,
    },
    closeIconButton: {
        padding: spacing.xs,
    },
    partnershipContainer: {
        alignItems: 'center',
        backgroundColor: colors.brandLight + '30', // 30% opacity
        paddingVertical: spacing.md,
        margin: spacing.md,
        borderRadius: radius.md,
        ...shadows.subtle,
    },
    partnershipValue: {
        fontSize: 36,
        fontWeight: '800',
        color: colors.brandBlue,
    },
    partnershipLabel: {
        fontSize: typography.sizeSM,
        color: colors.brandDark + '80', // 80% opacity
        marginBottom: spacing.sm,
    },
    partnershipDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
    },
    detailItem: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    detailDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.brandLight,
    },
    detailLabel: {
        fontSize: typography.sizeSM,
        color: colors.brandDark + '80', // 80% opacity
        marginBottom: spacing.xs / 2,
    },
    detailValue: {
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
    },
    highRunRate: {
        color: colors.brandGreen,
    },
    playerDetailsContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    playerCard: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.brandLight,
        ...shadows.subtle,
    },
    playerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    playerIcon: {
        marginRight: spacing.sm,
    },
    playerName: {
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
    },
    playerStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
    },
    statLabel: {
        fontSize: typography.sizeSM,
        color: colors.brandDark + '70', // 70% opacity
    },
    contributionBar: {
        height: 22,
        backgroundColor: colors.brandLight,
        borderRadius: radius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    contributionFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: colors.orange + '80', // 80% opacity
        borderRadius: radius.md,
    },
    nonStrikerContribution: {
        backgroundColor: colors.brandBlue + '80', // 80% opacity
    },
    contributionText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        lineHeight: 22,
        fontSize: typography.sizeSM,
        fontWeight: '500',
        color: colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    closeButton: {
        backgroundColor: colors.brandBlue,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        ...shadows.button,
    },
    buttonIcon: {
        marginRight: spacing.sm,
    },
    closeButtonText: {
        color: colors.white,
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
    }
});