import React from 'react';
import { View, Text } from 'react-native';
import { Team, InningsData } from '@/types';
import styles from '@/styles/batsmanBowlerRows';

interface BatsmenDisplayProps {
    battingTeam: Team;
    currentInnings: InningsData;
}

export default function BatsmenDisplay({ battingTeam, currentInnings }: BatsmenDisplayProps) {
    const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
    const nonStriker = battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId);

    const BatsmanRow = ({ player, isStriker }: { player: any; isStriker: boolean }) => (
        <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.playerColumn, isStriker ? styles.highlightedCell : null]}>
                {`${player.name} ${isStriker ? '*' : ''}`}
            </Text>
            <Text style={styles.tableCell}>{player.runs}</Text>
            <Text style={styles.tableCell}>{player.balls}</Text>
            <Text style={styles.tableCell}>{player.fours}</Text>
            <Text style={styles.tableCell}>{player.sixes}</Text>
            <Text style={[styles.tableCell, styles.lastColumn]}>
                {player.balls > 0 ? (player.runs / player.balls * 100).toFixed(1) : '0.0'}
            </Text>
        </View>
    );

    return (
        <View style={styles.scorecardContainer}>
            <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeader, styles.playerColumn]}>Batter</Text>
                <Text style={styles.tableHeader}>R</Text>
                <Text style={styles.tableHeader}>B</Text>
                <Text style={styles.tableHeader}>4s</Text>
                <Text style={styles.tableHeader}>6s</Text>
                <Text style={[styles.tableHeader, styles.lastColumn]}>SR</Text>
            </View>
            {striker && <BatsmanRow player={striker} isStriker={true} />}
            {nonStriker && <BatsmanRow player={nonStriker} isStriker={false} />}
        </View>
    );
}
