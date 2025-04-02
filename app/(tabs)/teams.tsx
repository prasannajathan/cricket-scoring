import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Text,
  View,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Team } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { getSavedMatches } from '@/utils/matchStorage';
import { colors, spacing, radius, shadows } from '@/constants/theme';
import Header from '@/components/scoring/Header';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  const handleTeamPress = (team: Team) => {
    router.push(`/team-detail/${team.id}`);
  };

  const getWinPercentage = (team: Team) => {
    if (!team.matchCount) return 0;
    return ((team.wins || 0) / team.matchCount * 100);
  };
  
  // Function to get color based on win percentage
  const getWinPercentageColor = (percentage: number) => {
    if (percentage >= 70) return colors.brandGreen;
    if (percentage >= 50) return colors.brandBlue;
    if (percentage >= 30) return colors.orange;
    return colors.brandRed;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header />
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandBlue} />
            <Text style={styles.loadingText}>Loading teams...</Text>
          </View>
        ) : (
          <FlatList
            data={teams}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <FontAwesome name="users" size={48} color={colors.ccc} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No teams found</Text>
                <Text style={styles.emptySubText}>Teams will appear here after you play matches</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const winPercentage = getWinPercentage(item);
              const winPercentageColor = getWinPercentageColor(winPercentage);
              
              return (
                <TouchableOpacity 
                  style={styles.teamCard}
                  onPress={() => handleTeamPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.teamHeader}>
                    <Text style={styles.teamName}>{item.teamName}</Text>
                    <View style={styles.arrowContainer}>
                      <FontAwesome name="angle-right" size={20} color={colors.brandBlue} />
                    </View>
                  </View>
                  
                  <View style={styles.statsContainer}>
                    <View style={styles.teamStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.matchCount || 0}</Text>
                        <Text style={styles.statLabel}>Matches</Text>
                      </View>
                      
                      <View style={styles.statSeparator} />
                      
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, {color: colors.brandGreen}]}>
                          {item.wins || 0}
                        </Text>
                        <Text style={styles.statLabel}>Wins</Text>
                      </View>
                      
                      <View style={styles.statSeparator} />
                      
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, {color: colors.brandRed}]}>
                          {(item.matchCount || 0) - (item.wins || 0)}
                        </Text>
                        <Text style={styles.statLabel}>Losses</Text>
                      </View>
                    </View>
                    
                    <View style={styles.winPercentageContainer}>
                      <View 
                        style={[
                          styles.winPercentageBadge, 
                          { backgroundColor: winPercentageColor + '15' } // Add 15% opacity
                        ]}
                      >
                        <Text style={[styles.winPercentageText, { color: winPercentageColor }]}>
                          {winPercentage.toFixed(1)}% Win Rate
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.footer}>
                    <View style={styles.playersCountContainer}>
                      <FontAwesome name="user" size={14} color={colors.brandDark} style={styles.playerIcon} />
                      <Text style={styles.playerCount}>
                        {item.players.length} Player{item.players.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    // backgroundColor: colors.brandLight,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  teamCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandDark,
  },
  arrowContainer: {
    padding: spacing.xs,
  },
  statsContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    backgroundColor: colors.brandLight,
    marginHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandDark,
  },
  statLabel: {
    fontSize: 13,
    color: colors.brandDark + '80', // 80% opacity
    marginTop: 2,
  },
  winPercentageContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  winPercentageBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
  },
  winPercentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.brandLight + '40', // 40% opacity
    borderTopWidth: 1,
    borderTopColor: colors.brandLight,
  },
  playersCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerIcon: {
    marginRight: spacing.xs,
  },
  playerCount: {
    fontSize: 14,
    color: colors.brandDark + '90', // 90% opacity
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.brandBlue,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    paddingTop: spacing.xxl * 2,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brandDark,
    marginBottom: spacing.md,
  },
  emptySubText: {
    fontSize: 15,
    color: colors.brandDark + '70', // 70% opacity
    textAlign: 'center',
  },
});
