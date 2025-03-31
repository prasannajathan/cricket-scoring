import React from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity 
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

interface EndInningsModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function EndInningsModal({
    visible,
    onClose,
    onConfirm
}: EndInningsModalProps) {
    const innings1 = useSelector((state: RootState) => state.scoreboard.innings1);
    const teamA = useSelector((state: RootState) => state.scoreboard.teamA);
    const teamB = useSelector((state: RootState) => state.scoreboard.teamB);
    
    const battingTeamName = innings1.battingTeamId === teamA.id ? teamA.teamName : teamB.teamName;
    const bowlingTeamName = innings1.battingTeamId !== teamA.id ? teamA.teamName : teamB.teamName;
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.headerContainer}>
                        <FontAwesome name="flag-checkered" size={24} color={colors.brandBlue} style={styles.headerIcon} />
                        <Text style={styles.title}>First Innings Complete</Text>
                    </View>
                    
                    <View style={styles.infoContainer}>
                        <View style={styles.scoreContainer}>
                            <Text style={styles.teamName}>{battingTeamName}</Text>
                            <Text style={styles.score}>
                                {innings1.totalRuns}
                                <Text style={styles.scoreDelimiter}>/</Text>
                                {innings1.wickets}
                            </Text>
                        </View>
                        
                        <View style={styles.oversContainer}>
                            <FontAwesome name="clock-o" size={16} color={colors.brandDark + '80'} style={styles.oversIcon} />
                            <Text style={styles.overs}>
                                {innings1.completedOvers}
                                <Text style={styles.oversDelimiter}>.</Text>
                                {innings1.ballInCurrentOver} overs
                            </Text>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.targetContainer}>
                            <Text style={styles.targetLabel}>
                                <FontAwesome name="bullseye" size={16} color={colors.brandRed} style={styles.targetIcon} />
                                {' '}Target for {bowlingTeamName}
                            </Text>
                            <Text style={styles.targetValue}>
                                {innings1.totalRuns + 1} runs
                            </Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={onConfirm}
                        activeOpacity={0.7}
                    >
                        <FontAwesome name="play" size={16} color={colors.white} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>
                            Start Second Innings
                        </Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        width: '85%',
        alignItems: 'center',
        ...shadows.modal,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
        width: '100%',
        justifyContent: 'center',
    },
    headerIcon: {
        marginRight: spacing.sm,
    },
    title: {
        fontSize: typography.sizeXL,
        fontFamily: typography.fontFamilyBold,
        fontWeight: typography.weightBold,
        color: colors.brandBlue,
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        width: '100%',
        backgroundColor: colors.brandLight + '30', // 30% opacity
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    teamName: {
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
        marginBottom: spacing.xs,
    },
    score: {
        fontSize: 32,
        fontFamily: typography.fontFamilyBold,
        fontWeight: '800',
        color: colors.brandDark,
    },
    scoreDelimiter: {
        color: colors.brandDark + '60', // 60% opacity
        fontSize: 28,
    },
    oversContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    oversIcon: {
        marginRight: spacing.xs,
    },
    overs: {
        fontSize: typography.sizeMD,
        color: colors.brandDark + '80', // 80% opacity
    },
    oversDelimiter: {
        color: colors.brandDark + '60', // 60% opacity
    },
    divider: {
        height: 1,
        backgroundColor: colors.brandLight,
        width: '80%',
        marginBottom: spacing.md,
    },
    targetContainer: {
        alignItems: 'center',
    },
    targetLabel: {
        fontSize: typography.sizeMD,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
        marginBottom: spacing.xs,
    },
    targetIcon: {
        marginRight: spacing.xs,
    },
    targetValue: {
        fontSize: 26,
        fontFamily: typography.fontFamilyBold,
        fontWeight: '800',
        color: colors.brandRed,
    },
    button: {
        backgroundColor: colors.brandGreen,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        ...shadows.button,
    },
    buttonIcon: {
        marginRight: spacing.sm,
    },
    buttonText: {
        color: colors.white,
        fontSize: typography.sizeLG,
        fontFamily: typography.fontFamilyBold,
        fontWeight: typography.weightBold,
    },
});