// utils/matchStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedMatch } from '@/types/matchTypes';

const MATCHES_KEY = 'CRICKET_MATCHES';

export async function loadMatches(): Promise<SavedMatch[]> {
  try {
    const json = await AsyncStorage.getItem(MATCHES_KEY);
    return json ? (JSON.parse(json) as SavedMatch[]) : [];
  } catch (err) {
    console.warn('Failed to load matches:', err);
    return [];
  }
}

export async function saveMatch(match: SavedMatch): Promise<void> {
  try {
    const matches = await loadMatches();
    const existingIndex = matches.findIndex((m) => m.id === match.id);
    if (existingIndex !== -1) {
      matches[existingIndex] = match;
    } else {
      matches.push(match);
    }
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  } catch (err) {
    console.warn('Failed to save match:', err);
  }
}