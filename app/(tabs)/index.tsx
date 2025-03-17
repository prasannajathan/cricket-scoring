import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView, 
  SafeAreaView,
  Alert
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

  // Load all saved teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        // Use the utility function to get all teams
        const teams = await getAllTeams();
        setAllTeams(teams);
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    };
    
    loadTeams();
  }, []);

  // Handle filtering team suggestions
  const filterTeamSuggestions = (text: string, isTeamA: boolean) => {
    if (text.length === 0) {
      // If the input is empty, don't show any suggestions
      if (isTeamA) {
        setShowTeamASuggestions(false);
      } else {
        setShowTeamBSuggestions(false);
      }
      return;
    }
    
    const filteredTeams = allTeams.filter(team => 
      team.teamName.toLowerCase().includes(text.toLowerCase())
    );
    
    if (isTeamA) {
      setTeamASuggestions(filteredTeams);
      setShowTeamASuggestions(true);
    } else {
      setTeamBSuggestions(filteredTeams);
      setShowTeamBSuggestions(true);
    }
  };

  // Handle selecting a team from suggestions
  const handleSelectTeam = (team: Team, isTeamA: boolean) => {
    if (isTeamA) {
      dispatch(setTeam({ team: 'teamA', teamData: team }));
      setShowTeamASuggestions(false);
    } else {
      dispatch(setTeam({ team: 'teamB', teamData: team }));
      setShowTeamBSuggestions(false);
    }
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
    <SafeAreaView style={{ flex: 1 }}>
      {/* Use TouchableWithoutFeedback to dismiss the keyboard when tapping outside */}
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Cricket Scorer</Text>
          <TouchableOpacity>
            <FontAwesome name="cog" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          keyboardShouldPersistTaps="handled"
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Set up your new match</Text>
          <Text style={styles.screenTitle}>Teams</Text>

          <View style={styles.inputCard}>
            <Text style={styles.label}>Team A Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Team A Name"
                value={teamA.teamName}
                onChangeText={(value) => {
                  dispatch(setTeamName({ team: 'teamA', name: value }));
                  filterTeamSuggestions(value, true);
                }}
                onFocus={() => {
                  if (teamA.teamName.length > 0) {
                    filterTeamSuggestions(teamA.teamName, true);
                  }
                }}
              />
              
              {/* Team A suggestions (outside ScrollView) */}
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

            <Text style={styles.label}>Team B Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Team B Name"
                value={teamB.teamName}
                onChangeText={(value) => {
                  dispatch(setTeamName({ team: 'teamB', name: value }));
                  filterTeamSuggestions(value, false);
                }}
                onFocus={() => {
                  if (teamB.teamName.length > 0) {
                    filterTeamSuggestions(teamB.teamName, false);
                  }
                }}
              />
              
              {/* Team B suggestions (outside ScrollView) */}
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

          <Text style={styles.sectionTitle}>Toss won by?</Text>
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

          <Text style={styles.sectionTitle}>Opted to?</Text>
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

          <Text style={styles.sectionTitle}>Overs?</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="number-pad"
            placeholder="20"
            value={String(totalOvers)}
            onChangeText={(value) => 
              dispatch(setTotalOvers(parseInt(value, 10) || 0))
            }
          />

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.filledButton]}
              onPress={handleStartMatch}
            >
              <Text style={[styles.buttonText, styles.filledButtonText]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 40, // Position below the input
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    maxHeight: 150,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 16,
  },
  suggestionSubtext: {
    fontSize: 12,
    color: '#666',
  },
  noSuggestionsText: {
    padding: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32' },
  settings: { fontSize: 16 },
  title: { fontSize: 18, marginBottom: 24 },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginVertical: 8,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  label: {
    fontWeight: '600',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    marginBottom: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  suggestionsList: {
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#2E7D32',
    marginVertical: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2E7D32',
    marginRight: 6,
  },
  radioSelected: {
    backgroundColor: '#2E7D32',
  },
  radioLabel: {
    fontSize: 15,
    color: '#333',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  outlineButtonText: {
    color: '#2E7D32',
  },
  filledButton: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filledButtonText: {
    color: '#FFFFFF',
  },
});