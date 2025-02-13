import React from 'react';
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
import type { RootState } from '@/store/store';
import {
  setOpeningStriker,
  setOpeningNonStriker,
  setOpeningBowler
} from '@/store/matchSlice';

export default function OpeningPlayersScreen() {
    const router = useRouter();
  const dispatch = useDispatch();

  // Pull existing opener names from Redux (if they exist)
  const { 
    openingStriker, 
    openingNonStriker, 
    openingBowler 
  } = useSelector((state: RootState) => state.match);

  const handleStartMatch = () => {
    // You could navigate to a scoring screen or somewhere else
    router.push('/scoring');
  };

  return (
    <ScrollView style={styles.container}>
      {/* The header back arrow typically appears automatically with a Stack.Navigator,
          so you might not need a custom back button. */}
      <Text style={styles.title}>Select Opening players</Text>

      {/* Striker */}
      <Text style={styles.label}>Striker</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Player name"
        value={openingStriker}
        onChangeText={val => dispatch(setOpeningStriker(val))}
      />

      {/* Non-striker */}
      <Text style={styles.label}>Non-striker</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Player name"
        value={openingNonStriker}
        onChangeText={val => dispatch(setOpeningNonStriker(val))}
      />

      {/* Opening bowler */}
      <Text style={styles.label}>Opening bowler</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Player name"
        value={openingBowler}
        onChangeText={val => dispatch(setOpeningBowler(val))}
      />

      {/* Start Match Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartMatch}>
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