// components/BowlerRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cricketer } from '../types';

interface BowlerRowProps {
  bowler: Cricketer;
}

const BowlerRow: React.FC<BowlerRowProps> = ({ bowler }) => {
  const totalBallsBowled = bowler.overs * 6 + bowler.ballsThisOver;
  const oversString = `${Math.floor(totalBallsBowled / 6)}.${totalBallsBowled % 6}`;

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.name}>{bowler.name}</Text>
      <Text style={styles.stat}>O: {oversString}</Text>
      <Text style={styles.stat}>R: {bowler.runsConceded}</Text>
      <Text style={styles.stat}>W: {bowler.wickets}</Text>
      <Text style={styles.stat}>Eco: {bowler.economy}</Text>
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