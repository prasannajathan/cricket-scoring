import React, { useState } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput,
    KeyboardAvoidingView,
    Platform 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

interface AdvancedScoringModalProps {
    visible: boolean;
    onClose: () => void;
    onScore: (runs: number) => void;
}

export default function AdvancedScoringModal({
    visible,
    onClose,
    onScore
}: AdvancedScoringModalProps) {
    const [runs, setRuns] = useState('');

    const handleSubmit = () => {
        const runsValue = parseInt(runs);
        if (!isNaN(runsValue)) {
            onScore(runsValue);
            setRuns('');
            onClose();
        }
    };

    const isValidInput = runs.trim() !== '' && !isNaN(parseInt(runs));

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.modalContainer}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <FontAwesome name="sliders" size={20} color={colors.brandBlue} style={styles.titleIcon} />
                        <Text style={styles.title}>Advanced Scoring</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <FontAwesome name="times" size={20} color={colors.ccc} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.helpTextContainer}>
                        <FontAwesome name="info-circle" size={16} color={colors.brandBlue} style={styles.helpIcon} />
                        <Text style={styles.helpText}>
                            Enter custom runs value if needed (5 or more runs)
                        </Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <FontAwesome name="hashtag" size={16} color={colors.ccc} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={runs}
                            onChangeText={setRuns}
                            keyboardType="number-pad"
                            placeholder="Enter runs"
                            placeholderTextColor={colors.bitDarkGrey}
                            returnKeyType="done"
                            onSubmitEditing={isValidInput ? handleSubmit : undefined}
                            autoFocus={true}
                        />
                    </View>

                    <View style={styles.quickButtonsContainer}>
                        <Text style={styles.quickButtonsLabel}>Quick Selection:</Text>
                        <View style={styles.quickButtonsRow}>
                            {[5, 7, 8, 10].map((value) => (
                                <TouchableOpacity 
                                    key={value} 
                                    style={styles.quickButton}
                                    onPress={() => {
                                        setRuns(value.toString());
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.quickButtonText}>{value}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.buttonRow}>
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
                                styles.scoreButton,
                                !isValidInput && styles.disabledButton
                            ]} 
                            onPress={handleSubmit}
                            disabled={!isValidInput}
                            activeOpacity={0.7}
                        >
                            <FontAwesome name="check" size={16} color={colors.white} style={styles.buttonIcon} />
                            <Text style={styles.scoreText}>Score</Text>
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
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        width: '85%',
        overflow: 'hidden',
        ...shadows.modal,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
    },
    titleIcon: {
        marginRight: spacing.xs,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontFamily: typography.fontFamilyBold,
        fontWeight: '700',
        color: colors.brandDark,
    },
    closeButton: {
        padding: spacing.xs,
    },
    helpTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.brandBlue + '10', // 10% opacity
        borderRadius: radius.md,
        padding: spacing.md,
        margin: spacing.md,
    },
    helpIcon: {
        marginRight: spacing.sm,
    },
    helpText: {
        fontSize: 14,
        color: colors.brandBlue,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.brandLight,
        borderRadius: radius.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        backgroundColor: colors.white,
        ...shadows.subtle,
    },
    inputIcon: {
        marginLeft: spacing.md,
    },
    input: {
        flex: 1,
        padding: spacing.md,
        fontSize: 18,
        color: colors.brandDark,
        fontWeight: '600',
    },
    quickButtonsContainer: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    quickButtonsLabel: {
        fontSize: 14,
        color: colors.brandDark + '80', // 80% opacity
        marginBottom: spacing.xs,
    },
    quickButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickButton: {
        backgroundColor: colors.brandLight,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 45,
    },
    quickButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.brandDark,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.brandLight,
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
    scoreButton: {
        backgroundColor: colors.brandGreen,
    },
    disabledButton: {
        backgroundColor: colors.brandLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    cancelText: {
        color: colors.brandDark,
        fontSize: 16,
        fontWeight: '600',
    },
    scoreText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    }
});