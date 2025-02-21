// components/BatsmanRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cricketer } from '@/types';

interface BatsmanRowProps {
  player: Cricketer;
  isStriker?: boolean;
}

const BatsmanRow: React.FC<BatsmanRowProps> = ({ player, isStriker }) => {
  return (
    <View style={styles.rowContainer}>
      <Text style={styles.name}>
        {player.name} {isStriker ? '*' : ''}
      </Text>
      <Text style={styles.stat}>R: {player.runs}</Text>
      <Text style={styles.stat}>B: {player.balls}</Text>
      <Text style={styles.stat}>4s: {player.fours}</Text>
      <Text style={styles.stat}>6s: {player.sixes}</Text>
      <Text style={styles.stat}>
        SR: {player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0'}
      </Text>
    </View>
  );
};

export default BatsmanRow;

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