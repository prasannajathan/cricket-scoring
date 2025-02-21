import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SuperOverState } from '@/utils/superOver';

interface SuperOverPanelProps {
    superOver: SuperOverState;
}

export default function SuperOverPanel({ superOver }: SuperOverPanelProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Super Over</Text>
            <View style={styles.scoreContainer}>
                <Text style={styles.teamScore}>
                    {`${superOver.team1Score}/${superOver.team1Wickets}`}
                </Text>
                <Text style={styles.versus}>vs</Text>
                <Text style={styles.teamScore}>
                    {`${superOver.team2Score}/${superOver.team2Wickets}`}
                </Text>
            </View>
            {superOver.currentInning === 2 && (
                <Text style={styles.target}>
                    {`Target: ${superOver.team1Score + 1}`}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1B5E20',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    teamScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginHorizontal: 16,
    },
    versus: {
        fontSize: 16,
        color: '#fff',
    },
    target: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginTop: 8,
    }
});