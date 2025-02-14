import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import type { RootState } from '@/store';
import {
  setOpeningStriker,
  setOpeningNonStriker,
  setOpeningBowler,
} from '@/store/scoreboardSlice';

export default function OpeningPlayersScreen() {
    const router = useRouter();
  const dispatch = useDispatch();

  const scoreboard = useSelector((state: RootState) => state.scoreboard);
  const { teamA, teamB } = scoreboard;

  // Figure out which team is batting / bowling
  const battingTeamKey = teamA.batting ? 'teamA' : 'teamB';
  const bowlingTeamKey = teamA.batting ? 'teamB' : 'teamA';

  // Access the current values from the scoreboard
  const battingTeam = scoreboard[battingTeamKey];
  const bowlingTeam = scoreboard[bowlingTeamKey];

  const handleStartScoring = () => {
    // You could navigate to a scoring screen or somewhere else
    router.push('/scoring');
  };

  return (
    <ScrollView style={styles.container}>
      {/* The header back arrow typically appears automatically with a Stack.Navigator,
          so you might not need a custom back button. */}
      <Text style={styles.title}>Select Opening players</Text>

      {/* Striker */}
      <Text style={styles.label}>Striker({battingTeam.teamName})</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Virat Kohli"
        value={battingTeam.openingStriker ?? ''}
        onChangeText={(val) => 
          dispatch(setOpeningStriker({ team: battingTeamKey, name: val }))
        }
      />

      {/* Non-striker */}
      <Text style={styles.label}>Non-striker ({battingTeam.teamName})</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Rohit Sharma"
        value={battingTeam.openingNonStriker ?? ''}
        onChangeText={(val) => 
          dispatch(setOpeningNonStriker({ team: battingTeamKey, name: val }))
        }
      />

      {/* Opening bowler */}
      <Text style={styles.label}>Opening bowler ({bowlingTeam.teamName})</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Jasprit Bumrah"
        value={bowlingTeam.openingBowler ?? ''}
        onChangeText={(val) => 
          dispatch(setOpeningBowler({ team: bowlingTeamKey, name: val }))
        }
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    marginBottom: 16,
    paddingHorizontal: 6,
    paddingVertical: 4,
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