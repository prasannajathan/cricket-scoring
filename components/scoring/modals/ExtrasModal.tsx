import React, { useState, useMemo } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectCurrentInnings } from '@/store/cricket/selectors';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

interface ExtrasModalProps {
    visible: boolean;
    onClose: () => void;
    onAddExtras: (runs: number) => void;
}

export default function ExtrasModal({ visible, onClose, onAddExtras }: ExtrasModalProps) {
    const [extraRuns, setExtraRuns] = useState('');
    const currentInnings = useSelector(selectCurrentInnings);
    
    // Calculate extras by type using the deliveries array
    const extrasBreakdown = useMemo(() => {
        if (!currentInnings?.deliveries) return { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 };
        
        return currentInnings.deliveries.reduce((acc, delivery) => {
            if (delivery.extraType === 'wide') {
                acc.wides += (1 + delivery.runs)
            } else if (delivery.extraType === 'no-ball') {
                acc.noBalls += 1 + Math.max(0, delivery.runs - delivery.batsmanRuns);
            } else if (delivery.extraType === 'bye') {
                acc.byes += delivery.runs;
            } else if (delivery.extraType === 'leg-bye') {
                acc.legByes += delivery.runs;
            } else if (delivery.extraType === 'penalty') {
                acc.penalties += delivery.runs;
            }
            return acc;
        }, { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 });
    }, [currentInnings?.deliveries]);
    
    const handleSubmit = () => {
        const runs = parseInt(extraRuns);
        if (!isNaN(runs) && runs > 0) {
            onAddExtras(runs);
            setExtraRuns('');
            onClose();
        }
    };

    // Get icon for each extra type
    const getExtraIcon = (type: string): keyof typeof FontAwesome.glyphMap => {
        switch(type) {
            case 'wides': return 'arrows-h';
            case 'noBalls': return 'warning';
            case 'byes': return 'share';
            case 'legByes': return 'child';
            case 'penalties': return 'gavel';
            default: return 'plus-circle';
        }
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
                                <FontAwesome name="plus-circle" size={20} color={colors.orange} style={styles.titleIcon} />
                                {' Extras'}
                            </Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <FontAwesome name="times" size={20} color={colors.ccc} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView 
                            style={styles.scrollContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.extrasContainer}>
                                <View style={styles.extrasSummary}>
                                    <FontAwesome name="calculator" size={24} color={colors.brandBlue} style={styles.summaryIcon} />
                                    <Text style={styles.totalExtrasText}>
                                        Total Extras: <Text style={styles.totalExtrasValue}>{currentInnings?.extras || 0}</Text> runs
                                    </Text>
                                </View>
                                
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailsTitle}>Breakdown by Type</Text>
                                    
                                    <ExtraRow 
                                        label="Wide Balls" 
                                        value={extrasBreakdown.wides} 
                                        icon={getExtraIcon('wides')} 
                                    />
                                    
                                    <ExtraRow 
                                        label="No Balls" 
                                        value={extrasBreakdown.noBalls} 
                                        icon={getExtraIcon('noBalls')} 
                                    />
                                    
                                    <ExtraRow 
                                        label="Byes" 
                                        value={extrasBreakdown.byes} 
                                        icon={getExtraIcon('byes')} 
                                    />
                                    
                                    <ExtraRow 
                                        label="Leg Byes" 
                                        value={extrasBreakdown.legByes} 
                                        icon={getExtraIcon('legByes')} 
                                    />
                                    
                                    <ExtraRow 
                                        label="Penalties" 
                                        value={extrasBreakdown.penalties} 
                                        icon={getExtraIcon('penalties')} 
                                        isLast={true}
                                    />
                                </View>
                                
                                <View style={styles.addExtraSection}>
                                    <View style={styles.sectionTitleRow}>
                                        <FontAwesome name="plus-square" size={16} color={colors.brandBlue} style={styles.sectionIcon} />
                                        <Text style={styles.addExtraTitle}>Add Extra Runs</Text>
                                    </View>
                                    
                                    <View style={styles.inputContainer}>
                                        <FontAwesome name="hashtag" size={16} color={colors.ccc} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={extraRuns}
                                            onChangeText={setExtraRuns}
                                            keyboardType="number-pad"
                                            placeholder="Enter runs"
                                            placeholderTextColor={colors.bitDarkGrey}
                                            returnKeyType="done"
                                            onSubmitEditing={() => extraRuns.trim() ? handleSubmit() : null}
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="times" size={16} color={colors.brandDark} style={styles.buttonIcon} />
                                <Text style={styles.cancelText}>Close</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.button, 
                                    styles.addButton,
                                    !extraRuns.trim() && styles.disabledButton
                                ]} 
                                onPress={handleSubmit}
                                disabled={!extraRuns.trim()}
                                activeOpacity={0.7}
                            >
                                <FontAwesome name="plus" size={16} color={colors.white} style={styles.buttonIcon} />
                                <Text style={styles.addText}>Add Extras</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

// Extract row component for DRY principle
interface ExtraRowProps {
    label: string;
    value: number;
    icon: keyof typeof FontAwesome.glyphMap;
    isLast?: boolean;
}

const ExtraRow = ({ label, value, icon, isLast = false }: ExtraRowProps) => (
    <View style={[styles.extrasRow, isLast && styles.lastRow]}>
        <View style={styles.extraLabelContainer}>
            <FontAwesome name={icon} size={14} color={colors.brandBlue} style={styles.extraIcon} />
            <Text style={styles.extrasLabel}>{label}:</Text>
        </View>
        <Text style={styles.extrasValue}>{value}</Text>
    </View>
);

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
    scrollContainer: {
        maxHeight: 400,
    },
    extrasContainer: {
        padding: spacing.md,
    },
    extrasSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.brandBlue + '10', // 10% opacity
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        ...shadows.subtle,
    },
    summaryIcon: {
        marginRight: spacing.md,
    },
    totalExtrasText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.brandDark,
    },
    totalExtrasValue: {
        color: colors.brandBlue,
        fontWeight: '700',
    },
    detailsContainer: {
        backgroundColor: colors.brandLight,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.subtle,
    },
    detailsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.brandDark,
        marginBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight + '80', // 80% opacity
        paddingBottom: spacing.xs,
    },
    extrasRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight + '80', // 80% opacity
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    extraLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    extraIcon: {
        marginRight: spacing.xs,
    },
    extrasLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.brandDark,
    },
    extrasValue: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.brandBlue,
    },
    addExtraSection: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionIcon: {
        marginRight: spacing.xs,
    },
    addExtraTitle: {
        fontSize: 16,
        fontWeight: '600',
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
        ...shadows.subtle,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        padding: spacing.md,
        fontSize: 16,
        color: colors.brandDark,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.brandLight,
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
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
    addButton: {
        backgroundColor: colors.orange,
    },
    disabledButton: {
        backgroundColor: colors.brandLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    cancelText: {
        color: colors.brandDark,
        fontSize: 15,
        fontWeight: '600',
    },
    addText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    }
});