// utils/matchStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScoreboardState } from '@/types'; // or wherever your types are

const STORAGE_KEY = 'CRICKET_MATCHES';

export async function saveMatch(match: ScoreboardState) {
  try {
    // 1. Get existing matches
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const matches = data ? JSON.parse(data) : [];

    // 2. Check if this match already exists
    const existingIndex = matches.findIndex((m: ScoreboardState) => m.id === match.id);

    // 3. Update or insert
    if (existingIndex !== -1) {
      matches[existingIndex] = match;
    } else {
      matches.push(match);
    }

    // 4. Save back
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch (error) {
    console.error('Error saving match:', error);
  }
}