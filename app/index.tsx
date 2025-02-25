import React, { useEffect } from 'react';
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
// Install react-native-get-random-values Import it before uuid:
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import type { RootState } from '@/store';
import {
  setTeamName,
  setTossWinner,
  setTossChoice,
  setTotalOvers,
  initializeInnings
} from '@/store/cricket/scoreboardSlice';
import Root from './+html';

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

  console.log('scoreboard', useSelector((state: RootState) => state.scoreboard))
  const handleAdvancedSettings = () => {
    router.push('/advancedSettings');
  };

  const handleStartMatch = () => {
    // Validate required fields
    if (!teamA.name.trim() || !teamB.name.trim()) {
      Alert.alert('Error', 'Please enter names for both teams');
      return;
    }

    if (!tossWinner) {
      Alert.alert('Error', 'Please select toss winner');
      return;
    }

    if (!tossChoice) {
      Alert.alert('Error', 'Please select toss choice');
      return;
    }

    if (!totalOvers || totalOvers <= 0) {
      Alert.alert('Error', 'Please enter valid number of overs');
      return;
    }

    // Set batting/bowling teams based on toss
    const battingTeam = tossChoice === 'bat' ? tossWinner : (tossWinner === 'teamA' ? 'teamB' : 'teamA');
    
    // Initialize first innings
    dispatch({
      type: 'scoreboard/initializeInnings',
      payload: {
        battingTeamId: battingTeam === 'teamA' ? teamA.id : teamB.id,
        bowlingTeamId: battingTeam === 'teamA' ? teamB.id : teamA.id
      }
    });

    router.push('/openingPlayers');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>[LOGO HERE]</Text>
        <TouchableOpacity>
          <Text style={styles.settings}>[Settings]</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Set up your new match</Text>
      <Text style={styles.screenTitle}>Teams</Text>

      <View style={styles.inputCard}>
        <Text style={styles.label}>Team A Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Team A Name"
          value={teamA.name}
          onChangeText={(value) => 
            dispatch(setTeamName({ team: 'teamA', name: value }))
          }
        />

        <Text style={styles.label}>Team B Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Team B Name"
          value={teamB.name}
          onChangeText={(value) => 
            dispatch(setTeamName({ team: 'teamB', name: value }))
          }
        />
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
          dispatch(setTotalOvers(parseInt(value, 10) || 1))
        }
      />

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
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  logo: { fontSize: 20, fontWeight: 'bold' },
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