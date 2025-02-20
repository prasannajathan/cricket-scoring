// app/(tabs)/history.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { loadMatches } from '@/utils/saveMatchStorage';
import { SavedMatch } from '@/types/matchTypes';

export default function HistoryScreen() {
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const router = useRouter();

  // Load saved matches on mount
  useEffect(() => {
    const loadSavedData = async () => {
      const data = await loadMatches();
      setSavedMatches(data);
    };
    loadSavedData();
  }, []);

  const handleViewScorecard = (matchId: string) => {
    // e.g. router.push(`/scorecard?matchId=${matchId}`);
    alert(`Viewing scorecard for match: ${matchId}`);
  };

  const handleResumeMatch = (matchId: string) => {
    // e.g. router.push(`/scoring?matchId=${matchId}`);
    alert(`Resuming match: ${matchId}`);
  };

  const renderItem = ({ item }: { item: SavedMatch }) => (
    <View style={styles.matchItem}>
      <Text style={styles.matchName}>{item.name}</Text>
      {item.completed ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleViewScorecard(item.id)}
        >
          <Text style={styles.buttonText}>View Scorecard</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleResumeMatch(item.id)}
        >
          <Text style={styles.buttonText}>Resume</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={savedMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ width: '100%' }}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  matchItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  matchName: { fontSize: 16, marginBottom: 8 },
  button: {
    backgroundColor: '#2E7D32',
    padding: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#FFF', fontWeight: '600' },
});