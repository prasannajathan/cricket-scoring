import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team, Cricketer } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { getSavedMatches } from '@/utils/matchStorage';

export default function CreateTeamScreen() {
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<Partial<Cricketer>[]>([
    { id: uuidv4(), name: '' },
    { id: uuidv4(), name: '' },
  ]);
  const router = useRouter();

  const addPlayer = () => {
    setPlayers([...players, { id: uuidv4(), name: '' }]);
  };

  const updatePlayerName = (index: number, name: string) => {
    const updatedPlayers = [...players];
    updatedPlayers[index] = { ...updatedPlayers[index], name };
    setPlayers(updatedPlayers);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) {
      Alert.alert('Error', 'A team must have at least 2 players');
      return;
    }
    const updatedPlayers = players.filter((_, i) => i !== index);
    setPlayers(updatedPlayers);
  };

  const saveTeam = async () => {
    // Validate inputs
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    const emptyPlayerIndex = players.findIndex(p => !p.name || !p.name.trim());
    if (emptyPlayerIndex !== -1) {
      Alert.alert('Error', `Please enter a name for player #${emptyPlayerIndex + 1}`);
      return;
    }

    try {
      // Get existing teams
      const savedTeamsJson = await getSavedMatches();
      const savedTeams: Team[] = savedTeamsJson ? JSON.parse(savedTeamsJson) : [];
      
      // Create new team with initialized player stats
      const newTeam: Team = {
        id: uuidv4(),
        teamName,
        players: players.map(p => ({
          id: p.id || uuidv4(),
          name: p.name || '',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
          overs: 0,
          ballsThisOver: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0,
          maidens: 0,
          catches: 0,
          runouts: 0,
        })),
      };
      
      // Save team
      await AsyncStorage.setItem('saved_teams', JSON.stringify([...savedTeams, newTeam]));
      Alert.alert('Success', 'Team created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving team:', error);
      Alert.alert('Error', 'Failed to save team');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color="#1B5E20" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Team</Text>
          <TouchableOpacity onPress={saveTeam}>
            <FontAwesome name="check" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput
            style={styles.input}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Enter team name"
          />
        </View>
        
        <View style={styles.formSection}>
          <View style={styles.playersHeader}>
            <Text style={styles.label}>Players</Text>
            <Text style={styles.playerCount}>{players.length} players</Text>
          </View>
          
          {players.map((player, index) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerIndex}>
                <Text style={styles.playerIndexText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.playerInput}
                value={player.name}
                onChangeText={(text) => updatePlayerName(index, text)}
                placeholder={`Player ${index + 1} name`}
              />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removePlayer(index)}
              >
                <FontAwesome name="minus-circle" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addPlayer}
          >
            <FontAwesome name="plus" size={16} color="white" />
            <Text style={styles.addButtonText}>Add Player</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveTeam}
        >
          <Text style={styles.saveButtonText}>Save Team</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerCount: {
    fontSize: 14,
    color: '#666',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playerIndexText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 10,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1B5E20',
    borderRadius: 6,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 6,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});