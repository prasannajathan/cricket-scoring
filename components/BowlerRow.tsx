// components/BowlerRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cricketer } from '@/types';

interface BowlerRowProps {
  bowler: Cricketer;
}

const BowlerRow: React.FC<BowlerRowProps> = ({ bowler }) => {
  // example overs display: overs + fraction from bowler.ballsThisOver
  const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
  const oversText = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.name}>{bowler.name}</Text>
      <Text style={styles.stat}>O: {oversText}</Text>
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
  name: { fontWeight: 'bold', width: '25%' },
  stat: { width: '15%', textAlign: 'center' },
});