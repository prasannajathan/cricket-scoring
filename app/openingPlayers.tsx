import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import type { RootState } from '@/store';
import { createCricketer } from '@/utils';
import {
  addPlayer,
  updateInningsPlayers,
  startInnings2
} from '@/store/cricket/scoreboardSlice';
import { selectBattingTeam, selectBowlingTeam } from '@/store/cricket/selectors';

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
  const existingBattingPlayers = battingTeam.players.filter(p => !p.isOut && !p.isRetired);
  const existingBowlingPlayers = bowlingTeam.players;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isSecondInnings ? 'Second Innings Setup' : 'Select Opening Players',
      headerBackTitle: 'Back',
    });
  }, [navigation, isSecondInnings]);

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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isSecondInnings ? 'Second Innings' : 'First Innings'}: Select Opening Players
      </Text>

      {/* First innings summary - only show for second innings */}
      {isSecondInnings && targetScore && (
        <View style={styles.firstInningsSummary}>
          <Text style={styles.firstInningsHeading}>First Innings Summary</Text>
          <Text style={styles.firstInningsScore}>
            {firstInningsTeamName}: {firstInningsScore}/{firstInningsWickets} ({firstInningsOvers} overs)
          </Text>
          <Text style={styles.targetText}>
            {battingTeam.teamName} needs {targetScore} runs to win
          </Text>
        </View>
      )}

      {/* Striker */}
      <Text style={styles.label}>Striker ({battingTeam.teamName})</Text>
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
      <TextInput
        style={[
          styles.textInput, 
          selectedStrikerId ? styles.disabledInput : {}
        ]}
        placeholder="Add new Striker name"
        value={newStrikerName}
        onChangeText={text => {
          setNewStrikerName(text);
          if (text.trim()) {
            setSelectedStrikerId('');
          }
        }}
        editable={!selectedStrikerId}
      />

      {/* Non-striker */}
      <Text style={styles.label}>Non-Striker ({battingTeam.teamName})</Text>
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
      <TextInput
        style={[
          styles.textInput, 
          selectedNonStrikerId ? styles.disabledInput : {}
        ]}
        placeholder="Add new Non-Striker name"
        value={newNonStrikerName}
        onChangeText={text => {
          setNewNonStrikerName(text);
          if (text.trim()) {
            setSelectedNonStrikerId('');
          }
        }}
        editable={!selectedNonStrikerId}
      />

      {/* Opening bowler */}
      <Text style={styles.label}>Opening Bowler ({bowlingTeam.teamName})</Text>
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
      <TextInput
        style={[
          styles.textInput, 
          selectedBowlerId ? styles.disabledInput : {}
        ]}
        placeholder="Add new Bowler name"
        value={newBowlerName}
        onChangeText={text => {
          setNewBowlerName(text);
          if (text.trim()) {
            setSelectedBowlerId('');
          }
        }}
        editable={!selectedBowlerId}
      />

      {/* Start Match Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartScoring}>
        <Text style={styles.startButtonText}>
          {isSecondInnings ? 'Start Second Innings' : 'Start Match'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    padding: 16,
  },
  title: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  firstInningsSummary: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  firstInningsHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  firstInningsScore: {
    fontSize: 18,
    color: '#1B5E20',
    marginBottom: 8,
  },
  targetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  label: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  playerSelection: {
    marginBottom: 12,
  },
  playerBubble: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedPlayerBubble: {
    backgroundColor: '#2E7D32',
  },
  playerBubbleText: {
    color: '#424242',
    fontSize: 14,
  },
  selectedPlayerBubbleText: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#F1F1F1',
    color: '#9E9E9E',
  },
  startButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});