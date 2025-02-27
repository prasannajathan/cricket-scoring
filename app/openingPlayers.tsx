import React, { useState, useLayoutEffect } from 'react';
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
// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import type { RootState } from '@/store';
import { createCricketer } from '@/utils';
import {
  addPlayer,
  updateInningsPlayers
} from '@/store/cricket/scoreboardSlice';
import { selectBattingTeam, selectBowlingTeam } from '@/store/cricket/selectors';

export default function OpeningPlayersScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const scoreboard = useSelector((state: RootState) => state.scoreboard);
  // "innings" param from the query, e.g. ?innings=2
  const { innings = '1' } = useLocalSearchParams();
  const isSecondInnings = innings === '2';
  const { teamA, teamB } = scoreboard;

  const battingTeam = useSelector(selectBattingTeam);
  const bowlingTeam = useSelector(selectBowlingTeam);

  // PART 1: We show a list of existing players from battingTeam.players, plus an "Add new" input
  const [selectedStrikerId, setSelectedStrikerId] = useState('');
  const [newStrikerName, setNewStrikerName] = useState('Sachin');

  const [selectedNonStrikerId, setSelectedNonStrikerId] = useState('');
  const [newNonStrikerName, setNewNonStrikerName] = useState('Sehwag');

  // PART 2: For the bowler side
  const [selectedBowlerId, setSelectedBowlerId] = useState('');
  const [newBowlerName, setNewBowlerName] = useState('Steyn');

  // Filter the existing players for the new batting side.
  // We might want only those who "bowled or fielded" last innings, or we can just show them all.
  const existingBattingPlayers = battingTeam.players;
  const existingBowlingPlayers = bowlingTeam.players;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Select Opening Players',
      headerBackTitle: 'Back',
    });
  }, [navigation]);

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
        dispatch(updateInningsPlayers({
            inningNumber: isSecondInnings ? 2 : 1,
            currentStrikerId: strikerId,
            currentNonStrikerId: nonStrikerId,
            currentBowlerId: bowlerId
        }));
        router.push('/scoring');
    } else {
        Alert.alert('Error', 'Please ensure all players are selected');
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* The header back arrow typically appears automatically with a Stack.Navigator,
          so you might not need a custom back button. */}
      <Text style={styles.title}>
        {isSecondInnings ? 'Second Innings' : 'First Innings'}: Select Opening Players
      </Text>

      {/* Striker */}
      <Text style={styles.label}>Striker({battingTeam.teamName})</Text>
      {/* Picker for existing players */}
      {/* <Picker
        selectedValue={selectedStrikerId}
        onValueChange={(val) => setSelectedStrikerId(val)}
      >
        <Picker.Item label="(Select existing)" value="" />
        {existingBattingPlayers.map((p) => (
          <Picker.Item label={p.name} value={p.id} key={p.id} />
        ))}
      </Picker> */}
      {/* Or new name input */}
      <TextInput
        style={styles.textInput}
        placeholder="Add new Striker name"
        value={newStrikerName}
        onChangeText={setNewStrikerName}
      />

      {/* Non-striker */}
      <Text style={styles.label}>Non-Striker ({battingTeam.teamName})</Text>
      {/* <Picker
        selectedValue={selectedNonStrikerId}
        onValueChange={(val) => setSelectedNonStrikerId(val)}
      >
        <Picker.Item label="(Select existing)" value="" />
        {existingBattingPlayers.map((p) => (
          <Picker.Item label={p.name} value={p.id} key={p.id} />
        ))}
      </Picker> */}
      <TextInput
        style={styles.textInput}
        placeholder="Add new Non-Striker name"
        value={newNonStrikerName}
        onChangeText={setNewNonStrikerName}
      />

      {/* Opening bowler */}
      <Text style={styles.label}>Opening Bowler ({bowlingTeam.teamName})</Text>
      {/* <Picker
        selectedValue={selectedBowlerId}
        onValueChange={(val) => setSelectedBowlerId(val)}
      >
        <Picker.Item label="(Select existing)" value="" />
        {existingBowlingPlayers.map((p) => (
          <Picker.Item label={p.name} value={p.id} key={p.id} />
        ))}
      </Picker> */}
      <TextInput
        style={styles.textInput}
        placeholder="Add new Bowler name"
        value={newBowlerName}
        onChangeText={setNewBowlerName}
      />

      {/* Start Match Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartScoring}>
        <Text style={styles.startButtonText}>Start match</Text>
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
  label: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 4,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    marginBottom: 16,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#FFF',
  },
  startButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});