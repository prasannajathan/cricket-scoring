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
        <View style={styles.batsmanRow}>
            <Text style={styles.batsmanName}>
                {`${player.name} ${isStriker ? '*' : ''}`}
            </Text>
            <Text style={styles.batsmanStat}>{player.runs}</Text>
            <Text style={styles.batsmanStat}>{player.balls}</Text>
            <Text style={styles.batsmanStat}>{player.fours}</Text>
            <Text style={styles.batsmanStat}>{player.sixes}</Text>
            <Text style={styles.batsmanStat}>
                {player.balls > 0 ? (player.runs / player.balls * 100).toFixed(1) : '0.0'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerCell, styles.nameCell]}>Batsman</Text>
                <Text style={styles.headerCell}>R</Text>
                <Text style={styles.headerCell}>B</Text>
                <Text style={styles.headerCell}>4s</Text>
                <Text style={styles.headerCell}>6s</Text>
                <Text style={styles.headerCell}>SR</Text>
            </View>
            {striker && <BatsmanRow player={striker} isStriker={true} />}
            {nonStriker && <BatsmanRow player={nonStriker} isStriker={false} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    header: {
        flexDirection: 'row',
        backgroundColor: '#E8F5E9',
        padding: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    headerCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1B5E20',
    },
    nameCell: {
        flex: 2,
        textAlign: 'left',
    },
    batsmanRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    batsmanName: {
        flex: 2,
        fontSize: 14,
        fontWeight: '500',
    },
    batsmanStat: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
    },
});