// app/(tabs)/history.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { getSavedMatches } from '@/utils/matchStorage';
import { SavedMatch } from '@/types';
import { useDispatch } from 'react-redux';
import { resetGame } from '@/store/cricket/scoreboardSlice';

export default function HistoryScreen() {
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Load saved matches on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    setIsLoading(true);
    try {
      const data = await getSavedMatches();
      setSavedMatches(data);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Could not load match history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedData();
    setRefreshing(false);
  };

  const handleViewScorecard = (matchId: string) => {
    router.push({
      pathname: '/scoring',
      params: { matchId, activeTab: 'scorecard' }
    });
  };

  const handleResumeMatch = async (matchId: string) => {
    try {
      const matches = await getSavedMatches();
      const matchToResume = matches.find(m => m.id === matchId);

      if (matchToResume) {
        // Reset current game state before loading saved state
        dispatch(resetGame());

        // Load the saved match state into Redux
        dispatch({
          type: 'scoreboard/loadSavedMatch',
          payload: matchToResume
        });

        // Navigate to scoring screen with tab param
        router.push({
          pathname: '/scoring',
          params: { matchId, activeTab: 'live' }
        });
      }
    } catch (error) {
      console.error('Error resuming match:', error);
      Alert.alert('Error', 'Could not resume match');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString();
  };

  const renderItem = ({ item }: { item: SavedMatch }) => (
    <View style={styles.matchItem}>
      <Text style={styles.matchName}>
        {`${item.teamA.teamName} vs ${item.teamB.teamName}`}
      </Text>
      <Text style={styles.matchDate}>
        {formatDate(item.timestamp)}
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
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading matches...' : 'No saved matches found'}
            </Text>
          </View>
        }
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
  matchDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: '#666',
    fontSize: 16
  }
});