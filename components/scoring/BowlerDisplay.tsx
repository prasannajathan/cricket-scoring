import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Team, InningsData, Cricketer } from '@/types';

interface BowlerRowProps {
  bowler: Cricketer;
}

const BowlerRow: React.FC<BowlerRowProps> = ({ bowler }) => {
  const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
  const oversText = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
  const economy = totalBalls > 0 ? ((bowler.runsConceded / totalBalls) * 6).toFixed(2) : '0.00';

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.name}>{bowler.name}</Text>
      <Text style={styles.stat}>O: {oversText}</Text>
      <Text style={styles.stat}>R: {bowler.runsConceded}</Text>
      <Text style={styles.stat}>W: {bowler.wickets}</Text>
      <Text style={styles.stat}>Eco: {economy}</Text>
    </View>
  );
};

interface BowlerDisplayProps {
  bowlingTeam: Team;
  currentInnings: InningsData;
}

export default function BowlerDisplay({ bowlingTeam, currentInnings }: BowlerDisplayProps) {
  const currentBowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);

  if (!currentBowler) return null;

  const computeOvers = (overs: number, balls: number) => {
    return `${overs}.${balls}`;
  };

  const computeEconomy = (runs: number, overs: number, balls: number) => {
    const totalOvers = overs + (balls / 6);
    return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Bowler</Text>
      <View style={styles.header}>
        <Text style={[styles.headerCell, styles.nameCell]}>Bowler</Text>
        <Text style={styles.headerCell}>O</Text>
        <Text style={styles.headerCell}>R</Text>
        <Text style={styles.headerCell}>W</Text>
        <Text style={styles.headerCell}>Econ</Text>
      </View>
      <View style={styles.bowlerRow}>
        <Text style={[styles.bowlerStat, styles.nameCell]}>{currentBowler.name}</Text>
        <Text style={styles.bowlerStat}>
          {computeOvers(currentBowler.overs, currentBowler.ballsThisOver)}
        </Text>
        <Text style={styles.bowlerStat}>{currentBowler.runsConceded}</Text>
        <Text style={styles.bowlerStat}>{currentBowler.wickets}</Text>
        <Text style={styles.bowlerStat}>
          {computeEconomy(
            currentBowler.runsConceded,
            currentBowler.overs,
            currentBowler.ballsThisOver
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    marginVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  name: { 
    fontWeight: 'bold', 
    width: '25%' 
  },
  stat: { 
    width: '15%', 
    textAlign: 'center' 
  },
  playerRow: {
    marginVertical: 4,
    width: '100%'
  },
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 8,
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
  bowlerRow: {
    flexDirection: 'row',
    padding: 8,
  },
  bowlerStat: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
});