import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { RootState } from '@/store';
import {
  selectBattingTeam,
  selectBowlingTeam,
} from '@/store/cricket/selectors';
import {
  setOpeningBatsmen,
  setOpeningBowler,
  initializeInnings
} from '@/store/cricket/scoreboardSlice';

export default function OpeningPlayersScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  
  // Get the innings number (1 or 2)
  const inningsNumber = params.innings ? Number(params.innings) : 1;
  
  // Get teams from state
  const { teamA, teamB, currentInning, targetScore } = useSelector((state: RootState) => state.scoreboard);
  const battingTeam = useSelector(selectBattingTeam);
  const bowlingTeam = useSelector(selectBowlingTeam);

  // Local state for selected players
  const [striker, setStriker] = useState<string | null>(null);
  const [nonStriker, setNonStriker] = useState<string | null>(null);
  const [bowler, setBowler] = useState<string | null>(null);
  
  // Local state for manually entered player names
  const [strikerName, setStrikerName] = useState<string>('');
  const [nonStrikerName, setNonStrikerName] = useState<string>('');
  const [bowlerName, setBowlerName] = useState<string>('');

  // Initialize second innings if needed
  useEffect(() => {
    if (inningsNumber === 2 && currentInning === 1) {
      // The first innings is complete, set up second innings
      // We need to swap batting and bowling teams
      dispatch(initializeInnings({
        battingTeamId: bowlingTeam?.id,
        bowlingTeamId: battingTeam?.id
      }));
    }
  }, [inningsNumber, currentInning]);

  const handleContinue = () => {
    // Use either selected players or manually entered names
    const finalStriker = striker || ('manual_' + strikerName);
    const finalNonStriker = nonStriker || ('manual_' + nonStrikerName);
    const finalBowler = bowler || ('manual_' + bowlerName);

    // Validate selections
    if ((!striker && !strikerName) || 
        (!nonStriker && !nonStrikerName) || 
        (!bowler && !bowlerName)) {
      Alert.alert('Error', 'Please select or enter all required players');
      return;
    }

    if (finalStriker === finalNonStriker) {
      Alert.alert('Error', 'Striker and non-striker cannot be the same player');
      return;
    }

    // Set the opening batsmen and bowler
    dispatch(setOpeningBatsmen({
      strikerId: finalStriker,
      nonStrikerId: finalNonStriker
    }));

    dispatch(setOpeningBowler({
      bowlerId: finalBowler
    }));

    // Navigate to scoring screen
    router.push('/(tabs)/scoring');
  };

  // Get players from teams
  const battingPlayers = battingTeam?.players || [];
  const bowlingPlayers = bowlingTeam?.players || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>
          {inningsNumber === 1 ? 'Select Opening Players' : 'Second Innings - Select Opening Players'}
        </Text>
        
        {inningsNumber === 2 && (
          <View style={styles.targetCard}>
            <Text style={styles.targetText}>
              Target: {targetScore} runs
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            {battingTeam?.name} - Batting
          </Text>
          
          <View style={styles.subSection}>
            <Text style={styles.subHeading}>Striker</Text>
            
            {/* Manual text input for striker */}
            <TextInput
              style={styles.textInput}
              placeholder="Enter striker name"
              value={strikerName}
              onChangeText={text => {
                setStrikerName(text);
                if (striker) setStriker(null); // Clear selection when typing
              }}
            />
            
            <Text style={styles.orText}>- OR -</Text>
            
            <ScrollView horizontal style={styles.playerList}>
              {battingPlayers.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerButton,
                    striker === player.id && styles.selectedPlayer
                  ]}
                  onPress={() => {
                    setStriker(player.id);
                    setStrikerName(''); // Clear manual entry when selecting
                  }}
                >
                  <Text style={[
                    styles.playerName,
                    striker === player.id && styles.selectedPlayerText
                  ]}>
                    {player.playerName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.subSection}>
            <Text style={styles.subHeading}>Non-striker</Text>
            
            {/* Manual text input for non-striker */}
            <TextInput
              style={styles.textInput}
              placeholder="Enter non-striker name"
              value={nonStrikerName}
              onChangeText={text => {
                setNonStrikerName(text);
                if (nonStriker) setNonStriker(null); // Clear selection when typing
              }}
            />
            
            <Text style={styles.orText}>- OR -</Text>
            
            <ScrollView horizontal style={styles.playerList}>
              {battingPlayers.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerButton,
                    nonStriker === player.id && styles.selectedPlayer
                  ]}
                  onPress={() => {
                    setNonStriker(player.id);
                    setNonStrikerName(''); // Clear manual entry when selecting
                  }}
                >
                  <Text style={[
                    styles.playerName,
                    nonStriker === player.id && styles.selectedPlayerText
                  ]}>
                    {player.playerName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            {bowlingTeam?.name} - Bowling
          </Text>
          
          <View style={styles.subSection}>
            <Text style={styles.subHeading}>Opening Bowler</Text>
            
            {/* Manual text input for bowler */}
            <TextInput
              style={styles.textInput}
              placeholder="Enter bowler name"
              value={bowlerName}
              onChangeText={text => {
                setBowlerName(text);
                if (bowler) setBowler(null); // Clear selection when typing
              }}
            />
            
            <Text style={styles.orText}>- OR -</Text>
            
            <ScrollView horizontal style={styles.playerList}>
              {bowlingPlayers.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerButton,
                    bowler === player.id && styles.selectedPlayer
                  ]}
                  onPress={() => {
                    setBowler(player.id);
                    setBowlerName(''); // Clear manual entry when selecting
                  }}
                >
                  <Text style={[
                    styles.playerName,
                    bowler === player.id && styles.selectedPlayerText
                  ]}>
                    {player.playerName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Start Innings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E7D32',
    textAlign: 'center',
  },
  targetCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  targetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subSection: {
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: 'white',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 8,
    color: '#777',
    fontSize: 14,
  },
  playerList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  playerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPlayer: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  playerName: {
    fontSize: 14,
    color: '#333',
  },
  selectedPlayerText: {
    color: 'white',
  },
  continueButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});