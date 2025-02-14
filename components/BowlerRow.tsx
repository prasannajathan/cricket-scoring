import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cricketer } from '../types';

interface BowlerRowProps {
  bowler: Cricketer;
}

const BowlerRow: React.FC<BowlerRowProps> = ({ bowler }) => {
  return (
    <View style={styles.rowContainer}>
      <Text style={styles.name}>{bowler.name}</Text>
      <Text style={styles.stat}>Overs: {bowler.balls / 6}</Text>
      {/* Adjust how you track bowler overs/runs/wickets if separate from Player */}
      <Text style={styles.stat}>Runs: {bowler.runs}</Text>
      <Text style={styles.stat}>Wkts: {bowler.sixes}</Text>
      {/* Example placeholders, adapt to actual bowler structure */}
      <Text style={styles.stat}>Eco: {bowler.strikeRate}</Text>
    </View>
  );
};

export default BowlerRow;

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 5,
    borderRadius: 4,
  },
  name: {
    fontWeight: 'bold',
    width: '25%',
  },
  stat: {
    width: '15%',
    textAlign: 'center',
  },
});