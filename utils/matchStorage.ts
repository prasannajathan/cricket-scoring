import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedMatch, Team } from '@/types';

const STORAGE_KEY = 'cricket_saved_matches';
const CURRENT_MATCH_KEY = '@cricket_scoring:current_match';
const TEAMS_STORAGE_KEY = 'saved_teams';

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

export const getAllTeams = async (): Promise<Team[]> => {
  try {
    let teams: Team[] = [];
    
    // First try to load from saved_teams
    const savedTeamsJson = await AsyncStorage.getItem(TEAMS_STORAGE_KEY);
    if (savedTeamsJson) {
      teams = JSON.parse(savedTeamsJson);
    }
    
    // Next, extract teams from matches if any
    const savedMatches = await getSavedMatches();
    const matchTeamsMap = new Map<string, Team>();
    
    // Extract unique teams from matches
    savedMatches.forEach(match => {
      if (match.teamA && !matchTeamsMap.has(match.teamA.id)) {
        matchTeamsMap.set(match.teamA.id, match.teamA);
      }
      if (match.teamB && !matchTeamsMap.has(match.teamB.id)) {
        matchTeamsMap.set(match.teamB.id, match.teamB);
      }
    });
    
    // Add unique teams from matches to our saved teams
    Array.from(matchTeamsMap.values()).forEach(team => {
      if (!teams.some(t => t.id === team.id)) {
        teams.push(team);
      }
    });
    
    // Sort teams alphabetically
    teams.sort((a, b) => a.teamName.localeCompare(b.teamName));
    
    return teams;
  } catch (error) {
    console.error('Error loading teams:', error);
    return [];
  }
};

export const saveTeam = async (team: Team): Promise<void> => {
  try {
    // Get all existing teams
    const existingTeams = await getAllTeams();
    
    // Check if team already exists
    const teamIndex = existingTeams.findIndex(t => t.id === team.id);
    
    if (teamIndex >= 0) {
      // Update existing team
      existingTeams[teamIndex] = team;
    } else {
      // Add new team
      existingTeams.push(team);
    }
    
    // Sort teams alphabetically
    existingTeams.sort((a, b) => a.teamName.localeCompare(b.teamName));
    
    // Save back to storage
    await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(existingTeams));
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    // Get all teams
    const teams = await getAllTeams();
    
    // Filter out the team to delete
    const filteredTeams = teams.filter(team => team.id !== teamId);
    
    // Save back to storage
    await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(filteredTeams));
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  try {
    const teams = await getAllTeams();
    return teams.find(team => team.id === teamId) || null;
  } catch (error) {
    console.error('Error getting team:', error);
    return null;
  }
};