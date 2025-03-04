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
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>First Innings Complete</Text>
                    
                    <View style={styles.infoContainer}>
                        <Text style={styles.score}>
                            {battingTeamName}: {innings1.totalRuns}/{innings1.wickets}
                        </Text>
                        <Text style={styles.overs}>
                            ({innings1.completedOvers}.{innings1.ballInCurrentOver} overs)
                        </Text>
                        <Text style={styles.message}>
                            Target: {innings1.totalRuns + 1} runs
                        </Text>
                    </View>
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.button}
                            onPress={onConfirm}
                        >
                            <Text style={styles.buttonText}>
                                Start Second Innings
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2E7D32',
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    overs: {
        fontSize: 16,
        marginBottom: 16,
        color: '#555',
    },
    message: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        backgroundColor: '#2E7D32',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});