import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedMatch } from '@/types';

const STORAGE_KEY = 'cricket_saved_matches';
const CURRENT_MATCH_KEY = '@cricket_scoring:current_match';

// AsyncStorage.clear();

export const saveMatch = async (match: SavedMatch): Promise<void> => {
    try {
        // Get existing saved matches
        const existingMatchesJson = await AsyncStorage.getItem(STORAGE_KEY);
        const existingMatches: SavedMatch[] = existingMatchesJson 
            ? JSON.parse(existingMatchesJson) 
            : [];
            
        // Find if this match already exists
        const matchIndex = existingMatches.findIndex(m => m.id === match.id);
        
        if (matchIndex >= 0) {
            // Update existing match
            existingMatches[matchIndex] = match;
        } else {
            // Add new match
            existingMatches.push(match);
        }
        
        // Save back to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingMatches));

        if (!match.completed) {
            await AsyncStorage.setItem(
                CURRENT_MATCH_KEY, 
                JSON.stringify(match)
            );
        }
    } catch (error) {
        console.error('Error saving match:', error);
        throw error;
    }
};

export const getSavedMatches = async (): Promise<SavedMatch[]> => {
    try {
        const matchesJson = await AsyncStorage.getItem(STORAGE_KEY);
        if (!matchesJson) return [];
        
        const matches: SavedMatch[] = JSON.parse(matchesJson);
        // Sort by timestamp descending (newest first)
        return matches.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
        console.error('Error getting saved matches:', error);
        return [];
    }
};

export const getCurrentMatch = async (): Promise<SavedMatch | null> => {
    try {
        const match = await AsyncStorage.getItem(CURRENT_MATCH_KEY);
        return match ? JSON.parse(match) : null;
    } catch (error) {
        console.error('Error getting current match:', error);
        return null;
    }
};

export const clearCurrentMatch = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CURRENT_MATCH_KEY);
    } catch (error) {
        console.error('Error clearing current match:', error);
        throw error;
    }
};

export const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
};

export const getSavedMatch = async (matchId: string): Promise<SavedMatch | null> => {
    try {
        const matches = await getSavedMatches();
        return matches.find(m => m.id === matchId) || null;
    } catch (error) {
        console.error('Error getting saved match:', error);
        return null;
    }
};

export const deleteSavedMatch = async (matchId: string): Promise<void> => {
    try {
        const matches = await getSavedMatches();
        const filteredMatches = matches.filter(m => m.id !== matchId);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMatches));
    } catch (error) {
        console.error('Error deleting saved match:', error);
        throw error;
    }
};