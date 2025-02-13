// MatchSettings.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store/store';
import {
  setPlayersPerTeam,
  setNoBallReball,
  setNoBallRun,
  setWideBallReball,
  setWideBallRun,
} from '@/store/matchSlice';

export default function AdvancedSettingsScreen() {
  const dispatch = useDispatch();

  const {
    playersPerTeam,
    noBallReball,
    noBallRun,
    wideBallReball,
    wideBallRun,
  } = useSelector((state: RootState) => state.match);

  const handleSaveSettings = () => {
    // e.g. pop screen or navigate back
    // navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Match Settings</Text>

      {/* Players per team */}
      <Text style={styles.label}>Players per team?</Text>
      <TextInput
        style={styles.textInput}
        value={playersPerTeam}
        keyboardType="number-pad"
        onChangeText={(val) => dispatch(setPlayersPerTeam(val))}
      />

      {/* No Ball */}
      <Text style={styles.sectionHeader}>No Ball</Text>
      <View style={styles.fieldGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Re-ball</Text>
          <Switch
            value={noBallReball}
            onValueChange={(val) => dispatch(setNoBallReball(val))}
            trackColor={{ true: '#2E7D32', false: '#767577' }}
            thumbColor={noBallReball ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        <View style={styles.runRow}>
          <Text style={styles.runLabel}>No ball run</Text>
          <TextInput
            style={styles.runInput}
            value={noBallRun}
            keyboardType="number-pad"
            onChangeText={(val) => dispatch(setNoBallRun(val))}
          />
        </View>
      </View>

      {/* Wide Ball */}
      <Text style={styles.sectionHeader}>Wide Ball</Text>
      <View style={styles.fieldGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Re-ball</Text>
          <Switch
            value={wideBallReball}
            onValueChange={(val) => dispatch(setWideBallReball(val))}
            trackColor={{ true: '#2E7D32', false: '#767577' }}
            thumbColor={wideBallReball ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        <View style={styles.runRow}>
          <Text style={styles.runLabel}>Wide ball run</Text>
          <TextInput
            style={styles.runInput}
            value={wideBallRun}
            keyboardType="number-pad"
            onChangeText={(val) => dispatch(setWideBallRun(val))}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveSettings}
      >
        <Text style={styles.saveButtonText}>Save settings</Text>
      </TouchableOpacity>

      {/* In your screenshot, you have some banner ads at the bottom—optional */}
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
    marginBottom: 8,
  },
  label: {
    color: '#2E7D32',
    fontSize: 16,
    marginVertical: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    padding: 6,
    marginBottom: 12,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  fieldGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 1, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  runLabel: {
    fontSize: 16,
    color: '#333',
  },
  runInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    minWidth: 40,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});