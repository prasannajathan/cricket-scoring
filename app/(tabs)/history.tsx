import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // If you’re using expo-router
import { ScoreboardState } from '@/types';

const STORAGE_KEY = 'CRICKET_MATCHES';

export default function HistoryScreen() {
  const [savedMatches, setSavedMatches] = useState<ScoreboardState[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadSavedMatches();
  }, []);

  async function loadSavedMatches() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const matches = JSON.parse(data);
        setSavedMatches(matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  }

  function handleMatchPress(match: ScoreboardState) {
    // If the match is completed, show scorecard
    if (match.matchOver) {
      // Either navigate to a "Scorecard" screen or show a final summary
      // For example, if you have a separate route for scorecards:
      router.push(`/scorecard?matchId=${match.id}`);
    } else {
      // If not completed, resume scoring
      router.push(`/(tabs)/scoring?matchId=${match.id}`);
    }
  }

  function renderMatchItem({ item }: { item: ScoreboardState }) {
    return (
      <TouchableOpacity
        onPress={() => handleMatchPress(item)}
        style={{
          padding: 12,
          marginVertical: 6,
          backgroundColor: '#eee',
          borderRadius: 4,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>{item.teamA.teamName} vs {item.teamB.teamName}</Text>
        <Text>Status: {item.matchOver ? 'Completed' : 'In Progress'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {savedMatches.length === 0 ? (
        <Text>No saved matches found.</Text>
      ) : (
        <FlatList
          data={savedMatches}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMatchItem}
        />
      )}
    </View>
  );
}