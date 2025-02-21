// components/BowlerRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cricketer } from '@/store/cricket/types';

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

export default BowlerRow;

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
  }
});