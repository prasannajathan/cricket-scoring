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
import { useNavigation } from '@react-navigation/native';

import type { RootState } from '@/store/store'; // adjust path if needed
import { 
  setHostTeam, 
  setVisitorTeam,
  setTossWinner,
  setBatOrBowl,
  setOvers,
} from '@/store/matchSlice';

export default function NewMatchScreen() {
  const router = useRouter();
  // Get values from Redux store
  const { hostTeam, visitorTeam, tossWinner, batOrBowl, overs } = useSelector(
    (state: RootState) => state.match
  ) as {
    hostTeam: string;
    visitorTeam: string;
    tossWinner: string;
    batOrBowl: string;
    overs: string;
  };
  const navigation = useNavigation();

  const dispatch = useDispatch();

  // Example button handlers
  const handleAdvancedSettings = () => {
    // navigation.navigate('advancedSettings' as never); 
    router.push('/advancedSettings');
  };

  const handleStartMatch = () => {
    // Now your match data is in Redux; you can do anything:
    // e.g., navigation to scoring screen
    // navigation.navigate('Scoring');
    // navigation.navigate('OpeningPlayers' as never);
    router.push('/openingPlayers');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Title */}
      <Text style={styles.screenTitle}>Teams</Text>

      {/* Host & Visitor Inputs */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.textInput}
          placeholder="Host Team"
          value={hostTeam}
          onChangeText={(value) => dispatch(setHostTeam(value))}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Visitor Team"
          value={visitorTeam}
          onChangeText={(value) => dispatch(setVisitorTeam(value))}
        />
      </View>

      {/* Toss Winner */}
      <Text style={styles.sectionTitle}>Toss won by?</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => dispatch(setTossWinner('host'))}
        >
          <View
            style={[
              styles.radioCircle,
              tossWinner === 'host' && styles.radioSelected,
            ]}
          />
          <Text style={styles.radioLabel}>Host Team</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => dispatch(setTossWinner('visitor'))}
        >
          <View
            style={[
              styles.radioCircle,
              tossWinner === 'visitor' && styles.radioSelected,
            ]}
          />
          <Text style={styles.radioLabel}>Visitor Team</Text>
        </TouchableOpacity>
      </View>

      {/* Opted to? */}
      <Text style={styles.sectionTitle}>Opted to?</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => dispatch(setBatOrBowl('bat'))}
        >
          <View
            style={[
              styles.radioCircle,
              batOrBowl === 'bat' && styles.radioSelected,
            ]}
          />
          <Text style={styles.radioLabel}>Bat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => dispatch(setBatOrBowl('bowl'))}
        >
          <View
            style={[
              styles.radioCircle,
              batOrBowl === 'bowl' && styles.radioSelected,
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
        placeholder="16"
        value={overs}
        onChangeText={(value) => dispatch(setOvers(value))}
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