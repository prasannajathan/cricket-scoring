// components/BatsmanRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cricketer } from '@/types';

interface BatsmanRowProps {
  player: Cricketer;
}

const BatsmanRow: React.FC<BatsmanRowProps> = ({ player }) => {
  return (
    <View style={styles.rowContainer}>
      <Text style={styles.name}>{player.name}</Text>
      <Text style={styles.stat}>R: {player.runs}</Text>
      <Text style={styles.stat}>B: {player.balls}</Text>
      <Text style={styles.stat}>4s: {player.fours}</Text>
      <Text style={styles.stat}>6s: {player.sixes}</Text>
      <Text style={styles.stat}>SR: {player.strikeRate}</Text>
    </View>
  );
};

export default BatsmanRow;

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