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
import { FontAwesome } from '@expo/vector-icons';

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
    if (text.length < 2) {
      if (isTeamA) {
        setShowTeamASuggestions(false);
      } else {
        setShowTeamBSuggestions(false);
      }
      return;
    }

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
      dispatch(setTeam({ team: 'teamA', teamData: team }));
      setShowTeamASuggestions(false);
      // Focus on next input after selection
      teamBInputRef.current?.focus();
    } else {
      dispatch(setTeam({ team: 'teamB', teamData: team }));
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>CricScoring</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <FontAwesome name="cog" size={24} color={colors.brandBlue} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={commonStyles.pageTitle}>New Match Setup</Text>

            {/* Teams Section */}
            <View style={styles.section}>
              <View>
                <Text style={commonStyles.label}>Team A</Text>
                <View style={commonStyles.inputWrapper}>
                  <TextInput
                    ref={teamAInputRef}
                    style={commonStyles.textInput}
                    placeholder="Enter team name"
                    placeholderTextColor={colors.ccc}
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
                      {teamASuggestions.length > 0 ? (
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
                      ) : (
                        <Text style={styles.noSuggestionsText}>No teams found</Text>
                      )}
                    </View>
                  )}
                </View>

                <Text style={commonStyles.label}>Team B</Text>
                <View style={commonStyles.inputWrapper}>
                  <TextInput
                    ref={teamBInputRef}
                    style={commonStyles.textInput}
                    placeholder="Enter team name"
                    placeholderTextColor={colors.ccc}
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
                      {teamBSuggestions.length > 0 ? (
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
                      ) : (
                        <Text style={styles.noSuggestionsText}>No teams found</Text>
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
                  placeholderTextColor={colors.ccc}
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
    ...shadows.card
  },
  logo: {
    fontSize: typography.sizeLG,
    fontWeight: typography.weightBold,
    color: colors.brandBlue,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
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
    zIndex: 10,
    ...shadows.card
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: typography.sizeMD,
    color: colors.brandDark,
  },
  suggestionSubtext: {
    fontSize: typography.sizeXS,
    color: colors.brandBlue,
  },
  noSuggestionsText: {
    padding: spacing.md,
    fontSize: typography.sizeSM,
    color: colors.ccc,
    fontStyle: 'italic',
    textAlign: 'center',
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
    marginTop: spacing.md,
  },
});