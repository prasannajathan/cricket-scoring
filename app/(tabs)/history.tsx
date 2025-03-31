// app/(tabs)/history.tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Text, 
  View,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSavedMatches, deleteSavedMatch } from '@/utils/matchStorage';
import { SavedMatch } from '@/types';
import { useDispatch } from 'react-redux';
import { resetGame } from '@/store/cricket/scoreboardSlice';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/constants/theme';

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
      // Sort matches by timestamp (newest first)
      const sortedData = [...data].sort((a, b) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      );
      setSavedMatches(sortedData);
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

  const deleteMatch = async (matchId: string) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Delete Match',
        'Are you sure you want to delete this match? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Use the utility function from matchStorage
                await deleteSavedMatch(matchId);
                
                // Update state after successful deletion
                setSavedMatches(prevMatches => 
                  prevMatches.filter(match => match.id !== matchId)
                );
              } catch (error) {
                console.error('Error in delete operation:', error);
                Alert.alert('Error', 'Failed to delete match');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing delete confirmation:', error);
      Alert.alert('Error', 'Could not process delete request');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' · ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }: { item: SavedMatch }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchName}>
          {`${item.teamA.teamName} vs ${item.teamB.teamName}`}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMatch(item.id)}
        >
          <FontAwesome name="trash-o" size={20} color={colors.brandRed} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.matchInfoRow}>
        <FontAwesome name="calendar" size={14} color={colors.brandBlue} style={styles.infoIcon} />
        <Text style={styles.matchDate}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        {item.completed ? (
          <View style={[styles.statusBadge, styles.completedBadge]}>
            <Text style={styles.statusBadgeText}>Completed</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.inProgressBadge]}>
            <Text style={styles.statusBadgeText}>In Progress</Text>
          </View>
        )}
        
        <Text style={styles.matchDetails}>
          {item.completed
            ? item.matchResult
            : `${item.innings1.totalRuns}/${item.innings1.wickets} (${item.innings1.completedOvers}.${item.innings1.ballInCurrentOver})`
          }
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {item.completed ? (
          <TouchableOpacity
            style={[styles.button, styles.viewButton]}
            onPress={() => handleViewScorecard(item.id)}
          >
            <FontAwesome name="list-alt" size={16} color={colors.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>View Scorecard</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.resumeButton]}
            onPress={() => handleResumeMatch(item.id)}
          >
            <FontAwesome name="play-circle" size={16} color={colors.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Resume Match</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Match History</Text>
        </View>
        
        <FlatList
          data={savedMatches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <View style={styles.loadingIndicator}>
                  <FontAwesome name="spinner" size={32} color={colors.brandBlue} />
                  <Text style={styles.emptyText}>Loading matches...</Text>
                </View>
              ) : (
                <View style={styles.noMatchesContainer}>
                  <FontAwesome name="inbox" size={48} color={colors.ccc} style={styles.noMatchesIcon} />
                  <Text style={styles.emptyText}>No saved matches found</Text>
                  <Text style={styles.emptySubtext}>Matches you score will appear here</Text>
                </View>
              )}
            </View>
          }
        />
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
    backgroundColor: colors.brandLight,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brandDark,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  matchCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brandDark,
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIcon: {
    marginRight: spacing.xs,
  },
  matchDate: {
    fontSize: 13,
    color: colors.brandBlue,
    fontWeight: '500',
  },
  scoreContainer: {
    marginBottom: spacing.lg,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  completedBadge: {
    backgroundColor: colors.brandGreen + '20', // 20% opacity
  },
  inProgressBadge: {
    backgroundColor: colors.orange + '20', // 20% opacity
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.completedBadge ? colors.brandGreen : colors.orange,
  },
  matchDetails: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brandDark,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    minWidth: 170,
  },
  viewButton: {
    backgroundColor: colors.brandGreen,
  },
  resumeButton: {
    backgroundColor: colors.brandBlue,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    color: colors.white, 
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  noMatchesContainer: {
    alignItems: 'center',
  },
  noMatchesIcon: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.ccc,
    fontSize: 14,
    marginTop: spacing.sm,
  }
});