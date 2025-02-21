import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchState } from '@/store/cricket/types/scoring';
import { SuperOverState } from '@/store/cricket/types';

const MATCH_STORAGE_KEY = '@cricket_scoring:matches';
const CURRENT_MATCH_KEY = '@cricket_scoring:current_match';

export interface SavedMatch extends MatchState {
    id: string;
    date: string;
    completed: boolean;
    superOver?: SuperOverState;
}

export const saveMatch = async (match: SavedMatch): Promise<void> => {
    try {
        const savedMatches = await getSavedMatches();
        const updatedMatches = savedMatches.map(m => 
            m.id === match.id ? match : m
        );

        if (!savedMatches.find(m => m.id === match.id)) {
            updatedMatches.push(match);
        }

        await AsyncStorage.setItem(
            MATCH_STORAGE_KEY, 
            JSON.stringify(updatedMatches)
        );

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
        const matches = await AsyncStorage.getItem(MATCH_STORAGE_KEY);
        return matches ? JSON.parse(matches) : [];
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