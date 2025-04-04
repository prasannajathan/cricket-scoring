import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

import type { RootState } from '@/store';
import {
  setTeamName,
  setTossWinner,
  setTossChoice,
  setTotalOvers,
  initializeInnings,
  setTeam
} from '@/store/cricket/scoreboardSlice';
import { Team } from '@/types';
import { getAllTeams } from '@/utils/matchStorage';
import { colors, spacing, typography, radius, shadows, commonStyles } from '@/constants/theme';
import { playerStats } from '@/utils';
import Header from '@/components/scoring/Header';

const determineBattingTeam = (
  tossWinner: 'teamA' | 'teamB',
  tossChoice: 'bat' | 'bowl'
): 'teamA' | 'teamB' => {
  if (tossChoice === 'bat') return tossWinner;
  return tossWinner === 'teamA' ? 'teamB' : 'teamA';
};

export default function NewMatchScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const {
    teamA,
    teamB,
    tossWinner,
    tossChoice,
    totalOvers,
  } = useSelector((state: RootState) => state.scoreboard);

  // State for team suggestions
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamASuggestions, setTeamASuggestions] = useState<Team[]>([]);
  const [teamBSuggestions, setTeamBSuggestions] = useState<Team[]>([]);
  const [showTeamASuggestions, setShowTeamASuggestions] = useState(false);
  const [showTeamBSuggestions, setShowTeamBSuggestions] = useState(false);

  // Refs for input fields
  const teamAInputRef = useRef<TextInput>(null);
  const teamBInputRef = useRef<TextInput>(null);

  // Load all saved teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await getAllTeams();
        setAllTeams(teams);
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    };

    loadTeams();

    // Add keyboard listener to handle focus out
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setShowTeamASuggestions(false);
        setShowTeamBSuggestions(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle filtering team suggestions
  const filterTeamSuggestions = (text: string, isTeamA: boolean) => {
    // Only show suggestions if 2 or more characters are typed
    // if (text.length < 2) {
    if (isTeamA) {
      setShowTeamASuggestions(false);
    } else {
      setShowTeamBSuggestions(false);
    }
    //   return;
    // }

    // Filter teams based on text input
    const filteredTeams = allTeams.filter(team =>
      team.teamName.toLowerCase().includes(text.toLowerCase())
    );

    // Remove duplicate teams
    const uniqueTeams = filteredTeams.filter((team, index, self) =>
      index === self.findIndex((t) => t.id === team.id)
    );

    if (isTeamA) {
      setTeamASuggestions(uniqueTeams);
      setShowTeamASuggestions(true);
    } else {
      setTeamBSuggestions(uniqueTeams);
      setShowTeamBSuggestions(true);
    }
  };

  // Handle selecting a team from suggestions
  const handleSelectTeam = (team: Team, isTeamA: boolean) => {
    if (isTeamA) {
      // Reset all player stats before setting the team
      const freshTeamPlayers = team.players.map(player => ({
        ...player,
        ...playerStats
      }));

      dispatch(setTeam({ 
        team: 'teamA', 
        teamData: {
          ...team,
          players: freshTeamPlayers
        }
      }));
      
      setShowTeamASuggestions(false);
      // Focus on next input after selection
      teamBInputRef.current?.focus();
    } else {
      // Reset all player stats before setting the team
      const freshTeamPlayers = team.players.map(player => ({
        ...player,
        ...playerStats
      }));

      dispatch(setTeam({ 
        team: 'teamB', 
        teamData: {
          ...team, 
          players: freshTeamPlayers
        }
      }));
      
      setShowTeamBSuggestions(false);
      // Hide keyboard after selecting Team B
      Keyboard.dismiss();
    }
  };

  // Handle focus outside the input fields
  const handleBlur = (isTeamA: boolean) => {
    // Use setTimeout to allow clicks on suggestion items to complete
    setTimeout(() => {
      if (isTeamA) {
        setShowTeamASuggestions(false);
      } else {
        setShowTeamBSuggestions(false);
      }
    }, 150);
  };

  const handleStartMatch = () => {
    // Validate inputs
    const validationErrors = {
      teams: !teamA.teamName.trim() || !teamB.teamName.trim(),
      toss: !tossWinner || !tossChoice,
      overs: !totalOvers || totalOvers <= 0
    };

    if (Object.values(validationErrors).some(Boolean)) {
      const errorMessage = validationErrors.teams
        ? 'Please enter names for both teams'
        : validationErrors.toss
          ? 'Please complete toss details'
          : 'Please enter valid number of overs';

      Alert.alert('Error', errorMessage);
      return;
    }

    try {
      const battingTeam = determineBattingTeam(tossWinner, tossChoice);

      // Safety check - ensure we have properly reset player stats
      // If teams were modified manually, make sure players arrays are appropriate
      if (teamA.players.length > 0) {
        const freshTeamAPlayers = teamA.players.map(player => ({
          ...player,
          ...playerStats
        }));
        dispatch(setTeam({ team: 'teamA', teamData: {...teamA, players: freshTeamAPlayers} }));
      }
      
      if (teamB.players.length > 0) {
        const freshTeamBPlayers = teamB.players.map(player => ({
          ...player,
          ...playerStats
        }));
        dispatch(setTeam({ team: 'teamB', teamData: {...teamB, players: freshTeamBPlayers} }));
      }

      // Initialize first innings with proper team IDs
      dispatch(initializeInnings({
        battingTeamId: battingTeam === 'teamA' ? teamA.id : teamB.id,
        bowlingTeamId: battingTeam === 'teamA' ? teamB.id : teamA.id
      }));

      router.push('/openingPlayers');
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize match. Please try again.');
      console.error('Match initialization failed:', error);
    }
  };

  // Add this effect to reset teams when names are manually changed
  useEffect(() => {
    // This ensures that whenever teams are manually changed (not from suggestions), 
    // we reset the player arrays
    const resetTeamPlayers = (teamKey: 'teamA' | 'teamB', teamName: string) => {
      // Only reset if we have players but the name was changed manually
      const team = teamKey === 'teamA' ? teamA : teamB;
      
      if (team.players.length > 0) {
        // Check if this is not a team selected from suggestions
        const isSuggestedTeam = allTeams.some(
          savedTeam => savedTeam.teamName === teamName && 
            savedTeam.players.length === team.players.length
        );
        
        if (!isSuggestedTeam) {
          // If not a suggested team, reset the players array
          dispatch(setTeam({ 
            team: teamKey, 
            teamData: {
              ...team,
              // Create a fresh team with no players
              players: []
            }
          }));
        }
      }
    };
    
    // Debounce these checks for performance
    const timeoutId = setTimeout(() => {
      resetTeamPlayers('teamA', teamA.teamName);
      resetTeamPlayers('teamB', teamB.teamName);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [teamA.teamName, teamB.teamName]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Header />

        <View style={commonStyles.container}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* <Text style={commonStyles.pageTitle}>Setup new match</Text> */}

            {/* Teams Section */}
            <View style={styles.section}>
              <View>
                <Text style={commonStyles.label}>Team A</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={teamAInputRef}
                    style={[commonStyles.textInput, styles.inputType]}
                    placeholder="Enter team name"
                    placeholderTextColor={colors.bitDarkGrey}
                    value={teamA.teamName}
                    onChangeText={(value) => {
                      dispatch(setTeamName({ team: 'teamA', name: value }));
                      filterTeamSuggestions(value, true);
                    }}
                    onFocus={() => {
                      if (teamA.teamName.length >= 2) {
                        filterTeamSuggestions(teamA.teamName, true);
                      }
                    }}
                    onBlur={() => handleBlur(true)}
                  />

                  {/* Team A suggestions */}
                  {showTeamASuggestions && (
                    <View style={styles.suggestionsContainer}>
                      {teamASuggestions.length > 0 && (
                        teamASuggestions.map(item => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectTeam(item, true)}
                          >
                            <Text style={styles.suggestionText}>{item.teamName}</Text>
                            <Text style={styles.suggestionSubtext}>
                              {item.players.length} players
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>

                <Text style={commonStyles.label}>Team B</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={teamBInputRef}
                    style={[commonStyles.textInput, styles.inputType]}
                    placeholder="Enter team name"
                    placeholderTextColor={colors.bitDarkGrey}
                    value={teamB.teamName}
                    onChangeText={(value) => {
                      dispatch(setTeamName({ team: 'teamB', name: value }));
                      filterTeamSuggestions(value, false);
                    }}
                    onFocus={() => {
                      if (teamB.teamName.length >= 2) {
                        filterTeamSuggestions(teamB.teamName, false);
                      }
                    }}
                    onBlur={() => handleBlur(false)}
                  />

                  {/* Team B suggestions */}
                  {showTeamBSuggestions && (
                    <View style={styles.suggestionsContainer}>
                      {teamBSuggestions.length > 0 && (
                        teamBSuggestions.map(item => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectTeam(item, false)}
                          >
                            <Text style={styles.suggestionText}>{item.teamName}</Text>
                            <Text style={styles.suggestionSubtext}>
                              {item.players.length} players
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Toss Section */}
            <View style={styles.section}>
              <View>
                <Text style={commonStyles.label}>Toss won by</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => dispatch(setTossWinner('teamA'))}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        tossWinner === 'teamA' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioLabel}>{teamA.teamName.trim() || 'Team A'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => dispatch(setTossWinner('teamB'))}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        tossWinner === 'teamB' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioLabel}>{teamB.teamName.trim() || 'Team B'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={commonStyles.label}>Opted to</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => dispatch(setTossChoice('bat'))}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        tossChoice === 'bat' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioLabel}>Bat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => dispatch(setTossChoice('bowl'))}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        tossChoice === 'bowl' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioLabel}>Bowl</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Match Format Section */}
            <View style={styles.section}>
              <View>
                <Text style={commonStyles.label}>Number of Overs</Text>
                <TextInput
                  style={commonStyles.textInput}
                  keyboardType="number-pad"
                  placeholder="e.g. 20"
                  placeholderTextColor={colors.bitDarkGrey}
                  value={totalOvers ? String(totalOvers) : ''}
                  onChangeText={(value) =>
                    dispatch(setTotalOvers(parseInt(value, 10) || 0))
                  }
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={commonStyles.buttonLg}
                onPress={handleStartMatch}
                activeOpacity={0.8}
              >
                <Text style={commonStyles.buttonLgText}>Next (select payers & start)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // container: {
  //   flex: 1,
  // },
  scrollContent: {
    paddingTop: spacing.md,
    // paddingHorizontal: spacing.lg,
    // paddingBottom: spacing.xxl,
  },


  section: {
    marginBottom: spacing.lg,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.brandLight,
    maxHeight: 150,
    zIndex: 1000, // Increase the z-index significantly
    elevation: 5, // For Android
    overflow: 'visible',
    marginTop: 2, // Add a small margin to separate from input
    ...shadows.card
  },
  
  // Update the inputWrapper style to ensure proper z-index handling
  inputWrapper: {
    position: 'relative',
    marginBottom: spacing.lg + 10,
  },
  inputType: {
    position: 'relative',
    zIndex:1,
  },
  suggestionItem: {
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  suggestionText: {
    fontSize: typography.sizeMD,
    color: colors.brandDark,
  },
  suggestionSubtext: {
    fontSize: typography.sizeXS,
    color: colors.brandBlue,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.brandBlue,
    marginRight: spacing.sm,
  },
  radioSelected: {
    backgroundColor: colors.brandBlue,
  },
  radioLabel: {
    fontSize: typography.sizeMD,
    color: colors.brandDark,
  },
  buttonContainer: {
    // marginTop: spacing.md,
  },
});