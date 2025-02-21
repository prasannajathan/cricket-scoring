// app/(tabs)/history.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { loadMatches } from '@/utils/saveMatchStorage';
import { SavedMatch } from '@/store/cricket/types';
import { useDispatch } from 'react-redux';
import { resetGame } from '@/store/cricket/scoreboardSlice';

export default function HistoryScreen() {
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const router = useRouter();
  const dispatch = useDispatch();

  // Load saved matches on mount
  useEffect(() => {
    const loadSavedData = async () => {
      const data = await loadMatches();
      setSavedMatches(data);
    };
    loadSavedData();
  }, []);

  const handleViewScorecard = (matchId: string) => {
    router.push({
      pathname: '/scorecard',
      params: { matchId }
    });
  };

  const handleResumeMatch = async (matchId: string) => {
    try {
      const matches = await loadMatches();
      const matchToResume = matches.find(m => m.id === matchId);
      
      if (matchToResume) {
        // Reset current game state before loading saved state
        dispatch(resetGame());
        
        // Load the saved match state into Redux
        dispatch({
          type: 'scoreboard/loadSavedMatch',
          payload: matchToResume
        });

        // Navigate to scoring screen
        router.push({
          pathname: '/scoring',
          params: { matchId }
        });
      }
    } catch (error) {
      console.error('Error resuming match:', error);
      Alert.alert('Error', 'Could not resume match');
    }
  };

  const renderItem = ({ item }: { item: SavedMatch }) => (
    <View style={styles.matchItem}>
      <Text style={styles.matchName}>
        {`${item.teamA.teamName} vs ${item.teamB.teamName}`}
      </Text>
      <Text style={styles.matchDetails}>
        {item.completed ? 
          `${item.matchResult}` : 
          `${item.innings1.totalRuns}/${item.innings1.wickets} (${item.innings1.completedOvers}.${item.innings1.ballInCurrentOver})`
        }
      </Text>
      {item.completed ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleViewScorecard(item.id)}
        >
          <Text style={styles.buttonText}>View Scorecard</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1976D2' }]}
          onPress={() => handleResumeMatch(item.id)}
        >
          <Text style={styles.buttonText}>Resume Match</Text>
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  matchName: { fontSize: 16, marginBottom: 8 },
  matchDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    minWidth: 120,
    alignItems: 'center'
  },
  buttonText: { color: '#FFF', fontWeight: '600' },
});