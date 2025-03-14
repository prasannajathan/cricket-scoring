import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Team, InningsData, Cricketer } from '@/types';

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
      <View style={styles.scorecardHeaderRow}>
        <Text style={styles.scorecardHeaderCell}>Bowler</Text>
        <Text style={styles.scorecardHeaderCell}>O</Text>
        <Text style={styles.scorecardHeaderCell}>M</Text>
        <Text style={styles.scorecardHeaderCell}>R</Text>
        <Text style={styles.scorecardHeaderCell}>W</Text>
        <Text style={styles.scorecardHeaderCell}>Econ</Text>
      </View>
      <View style={[styles.scorecardRow, styles.bowlerRow]}>
        <Text style={styles.scorecardCell}>{currentBowler.name}</Text>
        <Text style={styles.scorecardCell}>{oversText}</Text>
        {/* TODO: maiden overs */}
        <Text style={styles.scorecardCell}>{'m'}</Text>
        <Text style={styles.scorecardCell}>{currentBowler.runsConceded}</Text>
        <Text style={styles.scorecardCell}>{currentBowler.wickets}</Text>
        <Text style={styles.scorecardCell}>{economy}</Text>
      </View>
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
  bowlerRow: {
    backgroundColor: '#fafafa',
  }
});