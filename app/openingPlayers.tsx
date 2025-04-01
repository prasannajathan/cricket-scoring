import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import type { RootState } from '@/store';
import { createCricketer } from '@/utils';
import {
  addPlayer,
  updateInningsPlayers
} from '@/store/cricket/scoreboardSlice';
import { selectBattingTeam, selectBowlingTeam } from '@/store/cricket/selectors';
import { colors, spacing, radius, commonStyles } from '@/constants/theme';

export default function OpeningPlayersScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const scoreboard = useSelector((state: RootState) => state.scoreboard);
  const { innings = '1' } = useLocalSearchParams();
  const isSecondInnings = innings === '2';
  const { teamA, teamB, innings1 } = scoreboard;

  // Get the batting and bowling teams based on the current innings
  const battingTeam = useSelector(selectBattingTeam);
  const bowlingTeam = useSelector(selectBowlingTeam);

  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     title: isSecondInnings ? 'Second Innings Setup' : 'Select Opening Players',
  //     headerBackTitle: 'Back',
  //   });
  // }, [navigation, isSecondInnings]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitleVisible: false, // Hides the "Back" text
      headerTitle: '',               // Hides the header title
    });
  }, [navigation]);

  // When showing players for the second innings, make sure to set currentInning and apply startInnings2 
  useEffect(() => {
    if (isSecondInnings) {
        // Explicitly set currentInning to 2 and start the second innings
        if (scoreboard.currentInning !== 2 || !scoreboard.targetScore) {
            dispatch({ type: 'scoreboard/startInnings2' });
        }
    }
  }, [isSecondInnings, battingTeam.id, bowlingTeam.id, scoreboard.currentInning, scoreboard.targetScore]);

  // Get first innings information for showing target score
  const firstInningsScore = isSecondInnings ? innings1.totalRuns : 0;
  const targetScore = isSecondInnings ? firstInningsScore + 1 : undefined;
  const firstInningsTeamName = isSecondInnings ? 
    (innings1.battingTeamId === teamA.id ? teamA.teamName : teamB.teamName) : undefined;
  const firstInningsWickets = isSecondInnings ? innings1.wickets : 0;
  const firstInningsOvers = isSecondInnings ? 
    `${innings1.completedOvers}.${innings1.ballInCurrentOver}` : 0;

  const [selectedStrikerId, setSelectedStrikerId] = useState('');
  const [newStrikerName, setNewStrikerName] = useState('');

  const [selectedNonStrikerId, setSelectedNonStrikerId] = useState('');
  const [newNonStrikerName, setNewNonStrikerName] = useState('');

  const [selectedBowlerId, setSelectedBowlerId] = useState('');
  const [newBowlerName, setNewBowlerName] = useState('');

  // Filter the existing players for the new batting side.
  const existingBattingPlayers = battingTeam.players.filter(p => !p.isOut);
  const existingBowlingPlayers = bowlingTeam.players;

  const validatePlayerSelection = (selectedId: string, newName: string): boolean => {
    return !selectedId && !newName.trim();
  };

  const handleStartScoring = () => {
    // Validate selections
    if (validatePlayerSelection(selectedStrikerId, newStrikerName)) {
        Alert.alert('Error', 'Pick or create a new Striker');
        return;
    }
    if (validatePlayerSelection(selectedNonStrikerId, newNonStrikerName)) {
        Alert.alert('Error', 'Pick or create a new Non-Striker');
        return;
    }
    if (validatePlayerSelection(selectedBowlerId, newBowlerName)) {
        Alert.alert('Error', 'Pick or create a new Bowler');
        return;
    }

    // Handle player creation and assignment
    let strikerId = selectedStrikerId;
    let nonStrikerId = selectedNonStrikerId;
    let bowlerId = selectedBowlerId;

    // Create new players if needed
    if (!strikerId && newStrikerName.trim()) {
        strikerId = uuidv4();
        dispatch(addPlayer({
            team: battingTeam.id === teamA.id ? 'teamA' : 'teamB',
            player: createCricketer(strikerId, newStrikerName.trim())
        }));
    }

    if (!nonStrikerId && newNonStrikerName.trim()) {
        nonStrikerId = uuidv4();
        dispatch(addPlayer({
            team: battingTeam.id === teamA.id ? 'teamA' : 'teamB',
            player: createCricketer(nonStrikerId, newNonStrikerName.trim())
        }));
    }

    if (!bowlerId && newBowlerName.trim()) {
        bowlerId = uuidv4();
        dispatch(addPlayer({
            team: bowlingTeam.id === teamA.id ? 'teamA' : 'teamB',
            player: createCricketer(bowlerId, newBowlerName.trim())
        }));
    }

    // Update innings with player IDs
    if (strikerId && nonStrikerId && bowlerId) {
        // Make sure second innings is properly initialized
        if (isSecondInnings) {
            // Force set the target score again to be super sure
            if (!scoreboard.targetScore) {
                const targetScore = scoreboard.innings1.totalRuns + 1;
                dispatch({ 
                    type: 'scoreboard/setTargetScore', 
                    payload: targetScore
                });
            }
        }

        dispatch(updateInningsPlayers({
            inningNumber: isSecondInnings ? 2 : 1,
            currentStrikerId: strikerId,
            currentNonStrikerId: nonStrikerId,
            currentBowlerId: bowlerId
        }));
        
        // Navigate after a short delay
        setTimeout(() => {
            router.push('/scoring');
        }, 100);
    } else {
        Alert.alert('Error', 'Please ensure all players are selected');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={commonStyles.pageTitle}>
            {isSecondInnings ? 'Second Innings' : 'First Innings'}
          </Text>
          {/* <Text style={styles.subtitle}>Select Playing XI</Text> */}
        </View>

        {/* First innings summary - only show for second innings */}
        {isSecondInnings && targetScore && (
          <View style={styles.card}>
            <View style={styles.firstInningsSummary}>
              <Text style={styles.firstInningsHeading}>First Innings Summary</Text>
              <Text style={styles.firstInningsScore}>
                {firstInningsTeamName}: {firstInningsScore}/{firstInningsWickets} ({firstInningsOvers} overs)
              </Text>
              <View style={styles.targetContainer}>
                <FontAwesome name="bullseye" size={16} color={colors.brandRed} style={styles.targetIcon} />
                <Text style={styles.targetText}>
                  {battingTeam.teamName} needs {targetScore} runs to win
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Striker Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={commonStyles.label}>Striker</Text>
            <View style={styles.teamBadge}>
              <Text style={styles.teamBadgeText}>{battingTeam.teamName}</Text>
            </View>
          </View>
          
          {existingBattingPlayers.length > 0 && (
            <View style={styles.playerSelection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {existingBattingPlayers.map((player) => (
                  <TouchableOpacity 
                    key={player.id}
                    style={[
                      styles.playerBubble,
                      selectedStrikerId === player.id ? styles.selectedPlayerBubble : {}
                    ]}
                    onPress={() => {
                      setSelectedStrikerId(player.id);
                      setNewStrikerName('');
                    }}
                  >
                    <Text style={[
                      styles.playerBubbleText,
                      selectedStrikerId === player.id ? styles.selectedPlayerBubbleText : {}
                    ]}>
                      {player.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                commonStyles.textInput, 
                selectedStrikerId ? commonStyles.disabledInput : {}
              ]}
              placeholder="Add Striker name"
              placeholderTextColor={colors.ccc}
              value={newStrikerName}
              onChangeText={text => {
                setNewStrikerName(text);
                if (text.trim()) {
                  setSelectedStrikerId('');
                }
              }}
              editable={!selectedStrikerId}
            />
          </View>
        </View>

        {/* Non-striker Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={commonStyles.label}>Non-Striker</Text>
            <View style={styles.teamBadge}>
              <Text style={styles.teamBadgeText}>{battingTeam.teamName}</Text>
            </View>
          </View>
          
          {existingBattingPlayers.length > 0 && (
            <View style={styles.playerSelection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {existingBattingPlayers
                  .filter(p => p.id !== selectedStrikerId)
                  .map((player) => (
                    <TouchableOpacity 
                      key={player.id}
                      style={[
                        styles.playerBubble,
                        selectedNonStrikerId === player.id ? styles.selectedPlayerBubble : {}
                      ]}
                      onPress={() => {
                        setSelectedNonStrikerId(player.id);
                        setNewNonStrikerName('');
                      }}
                    >
                      <Text style={[
                        styles.playerBubbleText,
                        selectedNonStrikerId === player.id ? styles.selectedPlayerBubbleText : {}
                      ]}>
                        {player.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                commonStyles.textInput, 
                selectedNonStrikerId ? commonStyles.disabledInput : {}
              ]}
              placeholder="Add Non-Striker name"
              placeholderTextColor={colors.ccc}
              value={newNonStrikerName}
              onChangeText={text => {
                setNewNonStrikerName(text);
                if (text.trim()) {
                  setSelectedNonStrikerId('');
                }
              }}
              editable={!selectedNonStrikerId}
            />
          </View>
        </View>

        {/* Bowler Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={commonStyles.label}>Opening Bowler</Text>
            <View style={styles.teamBadge}>
              <Text style={styles.teamBadgeText}>{bowlingTeam.teamName}</Text>
            </View>
          </View>
          
          {existingBowlingPlayers.length > 0 && (
            <View style={styles.playerSelection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {existingBowlingPlayers.map((player) => (
                  <TouchableOpacity 
                    key={player.id}
                    style={[
                      styles.playerBubble,
                      selectedBowlerId === player.id ? styles.selectedPlayerBubble : {}
                    ]}
                    onPress={() => {
                      setSelectedBowlerId(player.id);
                      setNewBowlerName('');
                    }}
                  >
                    <Text style={[
                      styles.playerBubbleText,
                      selectedBowlerId === player.id ? styles.selectedPlayerBubbleText : {}
                    ]}>
                      {player.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                commonStyles.textInput, 
                selectedBowlerId ? commonStyles.disabledInput : {}
              ]}
              placeholder="Add Bowler name"
              placeholderTextColor={colors.ccc}
              value={newBowlerName}
              onChangeText={text => {
                setNewBowlerName(text);
                if (text.trim()) {
                  setSelectedBowlerId('');
                }
              }}
              editable={!selectedBowlerId}
            />
          </View>
        </View>

        {/* Start Match Button */}
        <TouchableOpacity 
          style={commonStyles.buttonLg} 
          onPress={handleStartScoring}
          activeOpacity={0.8}
        >
          <FontAwesome name="play-circle" size={18} color={colors.white} style={styles.startButtonIcon} />
          <Text style={commonStyles.buttonLgText}>
            {isSecondInnings ? 'Start Second Innings' : 'Start Match'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    // marginBottom: spacing.xl,
    display: 'flex',
    columnGap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // title: {
  //   fontSize: 24,
  //   fontWeight: '700',
  //   color: colors.brandDark,
  //   marginBottom: spacing.xs,
  // },
  subtitle: {
    fontSize: 16,
    color: colors.brandBlue,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstInningsSummary: {
    padding: spacing.lg,
  },
  firstInningsHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandBlue,
    marginBottom: spacing.md,
  },
  firstInningsScore: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brandDark,
    marginBottom: spacing.md,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  targetIcon: {
    marginRight: spacing.sm,
  },
  targetText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandRed,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamBadge: {
    marginLeft: spacing.md,
    backgroundColor: colors.brandBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  teamBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  playerSelection: {
    marginBottom: spacing.md,
  },
  playerBubble: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ccc,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedPlayerBubble: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  playerBubbleText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPlayerBubbleText: {
    color: colors.white,
  },
  inputContainer: {
    // marginBottom: spacing.xs,
  },
  startButtonIcon: {
    marginRight: spacing.sm,
  },
});