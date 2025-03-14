import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Team, InningsData, Cricketer } from '@/types';
import styles from '@/styles/batsmanBowlerRows';
interface BowlerDisplayProps {
  bowlingTeam: Team;
  currentInnings: InningsData;
}

export default function BowlerDisplay({ bowlingTeam, currentInnings }: BowlerDisplayProps) {
  const currentBowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);

  if (!currentBowler) return null;

  const oversText = `${currentBowler.overs}.${currentBowler.ballsThisOver}`;

  const economy = currentBowler.economy.toFixed(2);

  return (
    <View style={styles.scorecardContainer}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeader, styles.playerColumn]}>Bowler</Text>
        <Text style={styles.tableHeader}>O</Text>
        <Text style={styles.tableHeader}>M</Text>
        <Text style={styles.tableHeader}>R</Text>
        <Text style={styles.tableHeader}>W</Text>
        <Text style={[styles.tableHeader, styles.lastColumn]}>Econ</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.playerColumn]}>{currentBowler.name}</Text>
        <Text style={styles.tableCell}>{oversText}</Text>
        {/* TODO: maiden overs */}
        <Text style={styles.tableCell}>{'m'}</Text>
        <Text style={styles.tableCell}>{currentBowler.runsConceded}</Text>
        <Text style={styles.tableCell}>{currentBowler.wickets}</Text>
        <Text style={[styles.tableCell, styles.lastColumn]}>{economy}</Text>
      </View>
    </View>
  );
}
