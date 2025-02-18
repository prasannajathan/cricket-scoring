// (tabs)/index.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

import type { RootState } from '@/store';
import {
  setTeamName,
  setTossWinner,
  setTossChoice,
  setTotalOvers,
} from '@/store/scoreboardSlice';

export default function NewMatchScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  // Get values from Redux store
  const {
    teamA,
    teamB,
    tossWinner,
    tossChoice,
    totalOvers,
  } = useSelector((state: RootState) => state.scoreboard);

  // Example button handlers
  const handleAdvancedSettings = () => {
    // navigation.navigate('advancedSettings' as never); 
    router.push('/advancedSettings');
  };

  const handleStartMatch = () => {
    // Navigate to the next screen (e.g. pick opening players)
    router.push('/openingPlayers');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Title */}
      <Text style={styles.screenTitle}>Teams</Text>

      {/* TEAM A & TEAM B Inputs */}
      <View style={styles.inputCard}>
        <Text style={styles.label}>Team A Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Team A Name"
          value={teamA.teamName}
          onChangeText={(value) => 
            dispatch(setTeamName({ team: 'teamA', name: value }))
          }
        />

        <Text style={styles.label}>Team B Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Team B Name"
          value={teamB.teamName}
          onChangeText={(value) => 
            dispatch(setTeamName({ team: 'teamB', name: value }))
          }
        />
      </View>

      {/* Toss Winner */}
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
          <Text style={styles.radioLabel}>Team A</Text>
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
          <Text style={styles.radioLabel}>Team B</Text>
        </TouchableOpacity>
      </View>

      {/* Opted to? */}
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

      {/* Overs Input */}
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

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleAdvancedSettings}
        >
          <Text style={[styles.buttonText, styles.outlineButtonText]}>
            Advanced settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.filledButton]}
          onPress={handleStartMatch}
        >
          <Text style={[styles.buttonText, styles.filledButtonText]}>
            Start match
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// same styles as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
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