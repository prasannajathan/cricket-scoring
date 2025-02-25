import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectPartnershipRecords } from '@/store/cricket/selectors';

export const PartnershipCard: React.FC = () => {
  const { current, highest } = useSelector(selectPartnershipRecords);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Partnership</Text>
      {current && (
        <View style={styles.currentPartnership}>
          <Text style={styles.runs}>{current.runs}</Text>
          <Text style={styles.details}>
            ({current.balls} balls)
          </Text>
        </View>
      )}
      <Text style={styles.highest}>
        Highest: {highest?.runs || 0} runs
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentPartnership: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  runs: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  details: {
    marginLeft: 8,
    color: '#666',
  },
  highest: {
    fontSize: 14,
    color: '#666',
  },
});