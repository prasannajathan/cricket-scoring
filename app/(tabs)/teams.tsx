import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { Team } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { getSavedMatches } from '@/utils/matchStorage';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      // Get saved matches from storage
      const savedMatches = await getSavedMatches();
      
      // Extract unique teams from matches
      const uniqueTeams = new Map<string, Team>();
      
      savedMatches.forEach(match => {
        // Add team A if not already added
        if (!uniqueTeams.has(match.teamA.id)) {
          uniqueTeams.set(match.teamA.id, {
            ...match.teamA,
            matchCount: 1,
            wins: match.matchResult?.includes(match.teamA.teamName + " wins") ? 1 : 0
          });
        } else {
          // Update existing team
          const team = uniqueTeams.get(match.teamA.id)!;
          team.matchCount = (team.matchCount || 0) + 1;
          team.wins = (team.wins || 0) + (match.matchResult?.includes(match.teamA.teamName + " wins") ? 1 : 0);
          uniqueTeams.set(match.teamA.id, team);
        }
        
        // Add team B if not already added
        if (!uniqueTeams.has(match.teamB.id)) {
          uniqueTeams.set(match.teamB.id, {
            ...match.teamB,
            matchCount: 1,
            wins: match.matchResult?.includes(match.teamB.teamName + " wins") ? 1 : 0
          });
        } else {
          // Update existing team
          const team = uniqueTeams.get(match.teamB.id)!;
          team.matchCount = (team.matchCount || 0) + 1;
          team.wins = (team.wins || 0) + (match.matchResult?.includes(match.teamB.teamName + " wins") ? 1 : 0);
          uniqueTeams.set(match.teamB.id, team);
        }
      });
      
      // Convert map to array and sort by win percentage
      const teamsArray = Array.from(uniqueTeams.values())
        .sort((a, b) => {
          const aWinPct = (a.wins || 0) / (a.matchCount || 1);
          const bWinPct = (b.wins || 0) / (b.matchCount || 1);
          return bWinPct - aWinPct; // Sort by win percentage desc
        });
      
      setTeams(teamsArray);
    } catch (error) {
      console.error("Error loading teams:", error);
      Alert.alert("Error", "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamPress = (team: Team) => {
    router.push(`/team-detail/${team.id}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teams</Text>
      
      {teams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No teams found</Text>
          <Text style={styles.emptySubText}>Teams will appear here after you play matches</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.teamCard}
              onPress={() => handleTeamPress(item)}
            >
              <View style={styles.teamHeader}>
                <Text style={styles.teamName}>{item.teamName}</Text>
                <FontAwesome name="angle-right" size={20} color="#999" />
              </View>
              
              <View style={styles.teamStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.matchCount || 0}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.wins || 0}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(item.matchCount || 0) - (item.wins || 0)}</Text>
                  <Text style={styles.statLabel}>Losses</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {item.matchCount ? ((item.wins || 0) / item.matchCount * 100).toFixed(1) + '%' : '0%'}
                  </Text>
                  <Text style={styles.statLabel}>Win %</Text>
                </View>
              </View>
              
              <Text style={styles.playerCount}>
                {item.players.length} Players
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  teamCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  teamStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  playerCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
