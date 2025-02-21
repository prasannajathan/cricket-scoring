import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import type { RootState } from '@/store';

export default function ScorecardScreen() {
    const router = useRouter();
    const scoreboard = useSelector((state: RootState) => state.scoreboard);
    const {
        teamA,
        teamB,
        innings1,
        innings2,
        matchResult,
        totalOvers,
        targetScore
    } = scoreboard;

    const firstInningsBattingTeam = teamA.id === innings1.battingTeamId ? teamA : teamB;
    const firstInningsBowlingTeam = teamA.id === innings1.bowlingTeamId ? teamA : teamB;
    const secondInningsBattingTeam = teamA.id === innings2.battingTeamId ? teamA : teamB;
    const secondInningsBowlingTeam = teamA.id === innings2.bowlingTeamId ? teamA : teamB;

    const renderInnings = (
        inningsData: typeof innings1,
        battingTeam: typeof teamA,
        bowlingTeam: typeof teamB,
        inningsNumber: number
    ) => (
        <View style={styles.inningsContainer}>
            <Text style={styles.header}>{`${inningsNumber}${inningsNumber === 1 ? 'st' : 'nd'} Innings`}</Text>
            <Text style={styles.teamScore}>
                {`${battingTeam.teamName} ${inningsData.totalRuns}/${inningsData.wickets}`}
            </Text>
            <Text style={styles.oversText}>
                {`(${inningsData.completedOvers}.${inningsData.ballInCurrentOver} overs)`}
                {inningsNumber === 2 && targetScore && (
                    <Text style={styles.targetText}>{` Target: ${targetScore}`}</Text>
                )}
            </Text>
            
            {/* Batting */}
            <Text style={styles.subHeader}>Batting</Text>
            {battingTeam.players
                .filter(player => player.balls > 0)
                .map(player => (
                    <View key={player.id} style={styles.playerRow}>
                        <Text style={styles.playerName}>
                            {player.name}
                            {player.isOut ? ' (out)' : ''}
                        </Text>
                        <Text style={styles.statText}>{`${player.runs}(${player.balls})`}</Text>
                        <Text style={styles.statText}>{`4s: ${player.fours} 6s: ${player.sixes}`}</Text>
                        <Text style={styles.statText}>
                            {`SR: ${player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0'}`}
                        </Text>
                    </View>
                ))}

            {/* Extras and Total */}
            <View style={styles.extrasRow}>
                <Text style={styles.extrasText}>{`Extras: ${inningsData.extras}`}</Text>
            </View>

            {/* Bowling */}
            <Text style={styles.subHeader}>Bowling</Text>
            {bowlingTeam.players
                .filter(player => player.overs > 0)
                .map(player => (
                    <View key={player.id} style={styles.playerRow}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.statText}>
                            {`${Math.floor(player.overs)}.${player.ballsThisOver}`}
                        </Text>
                        <Text style={styles.statText}>{`${player.runsConceded}-${player.wickets}`}</Text>
                        <Text style={styles.statText}>
                            {`Eco: ${((player.runsConceded / (player.overs * 6)) * 6).toFixed(2)}`}
                        </Text>
                    </View>
                ))}
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView style={styles.container}>
                {/* Match Result */}
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>{matchResult}</Text>
                </View>

                {/* First Innings */}
                {renderInnings(innings1, firstInningsBattingTeam, firstInningsBowlingTeam, 1)}

                {/* Second Innings */}
                {innings2.battingTeamId && renderInnings(innings2, secondInningsBattingTeam, secondInningsBowlingTeam, 2)}

                {/* Back to Home Button */}
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => router.push('/')}
                >
                    <Text style={styles.buttonText}>Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    resultContainer: {
        padding: 16,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        marginBottom: 16,
    },
    resultText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B5E20',
        textAlign: 'center',
    },
    inningsContainer: {
        marginBottom: 20,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginVertical: 5,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 15,
        marginBottom: 5,
    },
    teamScore: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    oversText: {
        fontSize: 14,
        color: '#666',
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    playerName: {
        flex: 2,
        fontSize: 14,
    },
    statText: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
    },
    extrasRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    extrasText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
    },
    targetText: {
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    button: {
        backgroundColor: '#1B5E20',
        padding: 16,
        borderRadius: 8,
        marginVertical: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
