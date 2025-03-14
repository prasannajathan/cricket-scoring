import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Team, InningsData } from '@/types';

interface BatsmenDisplayProps {
    battingTeam: Team;
    currentInnings: InningsData;
}

export default function BatsmenDisplay({ battingTeam, currentInnings }: BatsmenDisplayProps) {
    const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
    const nonStriker = battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId);

    const BatsmanRow = ({ player, isStriker }: { player: any; isStriker: boolean }) => (
        <View style={styles.scorecardRow}>
            <Text style={[styles.scorecardCell, isStriker ? styles.onStrike : null]}>
                {`${player.name} ${isStriker ? '*' : ''}`}
            </Text>
            <Text style={[styles.scorecardCell, styles.highlight]}>{player.runs}</Text>
            <Text style={styles.scorecardCell}>{player.balls}</Text>
            <Text style={styles.scorecardCell}>{player.fours}</Text>
            <Text style={styles.scorecardCell}>{player.sixes}</Text>
            <Text style={styles.scorecardCell}>
                {player.balls > 0 ? (player.runs / player.balls * 100).toFixed(1) : '0.0'}
            </Text>
        </View>
    );

    return (
        <View style={styles.scorecardContainer}>
            <View style={styles.scorecardHeaderRow}>
                <Text style={styles.scorecardHeaderCell}>Batter</Text>
                <Text style={styles.scorecardHeaderCell}>R</Text>
                <Text style={styles.scorecardHeaderCell}>B</Text>
                <Text style={styles.scorecardHeaderCell}>4s</Text>
                <Text style={styles.scorecardHeaderCell}>6s</Text>
                <Text style={styles.scorecardHeaderCell}>SR</Text>
            </View>
            {striker && <BatsmanRow player={striker} isStriker={true} />}
            {nonStriker && <BatsmanRow player={nonStriker} isStriker={false} />}
        </View>
    );
}

const styles = StyleSheet.create({
    scorecardContainer: {
        marginBottom: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eaeaea',
        borderRadius: 4,
      },
      scorecardHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
      },
      scorecardHeaderCell: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 8,
        fontWeight: '600',
        color: '#007bff',
      },
      scorecardRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
      },
      scorecardCell: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 8,
        color: '#333',
      },
      onStrike: {
        fontWeight: 'bold',
        color: '#28a745',
      },
      highlight: {
        color: '#ef8c00',
        fontWeight: 'bold',
      },
});