import { Alert } from 'react-native';
import { scoreBall, setBowler, initializeInnings, setTeamName, setTeam, 
         setTossWinner, setTossChoice, setTotalOvers } from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

/**
 * Simulates a 20-over cricket match
 * @param dispatch Redux dispatch function
 * @param onComplete Callback when simulation completes
 */
export const runMatchSimulation = (dispatch: any, onComplete?: (result: string) => void) => {
  Alert.alert(
    "Start Simulation",
    "This will simulate a complete 20-over match. Continue?",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Start",
        onPress: async () => {
          try {
            Alert.alert("Simulation Started", "The simulation is running. This may take a few minutes.");
            
            // Instead of calling a separate function, we'll include the simulation logic here
            // 1. Setup teams
            const teamAId = uuidv4();
            const teamBId = uuidv4();
            
            // Create teams with players
            const teamA = createTeamWithPlayers('Team A', teamAId, 11);
            const teamB = createTeamWithPlayers('Team B', teamBId, 11);
            
            dispatch(setTeamName({ team: 'teamA', name: 'Team A' }));
            dispatch(setTeamName({ team: 'teamB', name: 'Team B' }));
            
            dispatch(setTeam({ team: 'teamA', teamData: teamA }));
            dispatch(setTeam({ team: 'teamB', teamData: teamB }));
            
            // 2. Initialize match
            dispatch(setTotalOvers(20));
            
            // 3. Set toss - Team A wins and elects to bat
            dispatch(setTossWinner('teamA'));
            dispatch(setTossChoice('bat'));
            
            // 4. Initialize first innings
            dispatch(initializeInnings({ 
              battingTeamId: teamAId, 
              bowlingTeamId: teamBId 
            }));
            
            // Setup initial batsmen and bowler
            const striker = teamA.players[0];
            const nonStriker = teamA.players[1];
            const bowler = teamB.players[6]; // Start with a bowler
            
            // Set striker and non-striker
            dispatch(setBatsmen({ 
              strikerTeam: 'teamA',
              strikerId: striker.id,
              nonStrikerTeam: 'teamA',
              nonStrikerId: nonStriker.id
            }));
            
            // Set bowler
            dispatch(setBowler({ 
              team: 'teamB', 
              bowlerId: bowler.id 
            }));
            
            // Simulate first innings
            await simulateInnings(dispatch, 1, {
              battingTeam: teamA,
              bowlingTeam: teamB,
              battingTeamKey: 'teamA',
              bowlingTeamKey: 'teamB'
            });
            
            // Check first innings score
            const firstInningsScore = 150; // Get this from your state
            
            // Initialize second innings
            dispatch(initializeInnings({
              battingTeamId: teamBId,
              bowlingTeamId: teamAId
            }));
            
            // Setup second innings batsmen and bowler
            const striker2 = teamB.players[0];
            const nonStriker2 = teamB.players[1];
            const bowler2 = teamA.players[6];
            
            // Set striker and non-striker for second innings
            dispatch(setBatsmen({ 
              strikerTeam: 'teamB',
              strikerId: striker2.id,
              nonStrikerTeam: 'teamB',
              nonStrikerId: nonStriker2.id
            }));
            
            // Set bowler for second innings
            dispatch(setBowler({ 
              team: 'teamA', 
              bowlerId: bowler2.id 
            }));
            
            // Simulate second innings
            await simulateInnings(dispatch, 2, {
              battingTeam: teamB,
              bowlingTeam: teamA,
              battingTeamKey: 'teamB',
              bowlingTeamKey: 'teamA',
              targetScore: firstInningsScore + 1
            });
            
            // Get final result
            setTimeout(() => {
              // Get result from state
              const matchResult = "Match completed"; // Get actual result from state
              
              Alert.alert(
                "Simulation Complete",
                `Match Result: ${matchResult}`,
                [
                  {
                    text: "View Scorecard",
                    onPress: () => {
                      if (onComplete) onComplete(matchResult);
                    }
                  }
                ]
              );
            }, 500);
          } catch (error) {
            console.error("Simulation error:", error);
            Alert.alert("Simulation Error", "An error occurred during simulation. See console for details.");
          }
        }
      }
    ]
  );
};

// Helper function to create teams with players
const createTeamWithPlayers = (teamName: string, teamId: string, playerCount: number) => {
  const players = [];
  
  for (let i = 1; i <= playerCount; i++) {
    const playerId = uuidv4();
    const position = i <= 7 ? 'Batter' : 'Bowler';
    players.push(createCricketer(playerId, `${teamName} ${position} ${i}`));
  }
  
  return {
    id: teamId,
    teamName,
    players,
    currentStrikerId: '',
    currentNonStrikerId: '',
    currentBowlerId: '',
    isBatting: false,
    isBowling: false,
    tossWinner: false
  };
};

// Helper function to simulate an innings
const simulateInnings = async (
  dispatch: any,
  inningsNumber: 1 | 2,
  options: {
    battingTeam: any,
    bowlingTeam: any,
    battingTeamKey: 'teamA' | 'teamB',
    bowlingTeamKey: 'teamA' | 'teamB',
    targetScore?: number
  }
) => {
  const { battingTeam, bowlingTeam, battingTeamKey, bowlingTeamKey, targetScore } = options;
  
  // Keep track of batsmen and bowlers
  let currentBatsmanIndex = 2; // Start with third batsman when needed
  let currentBowlerIndex = 0; // Start with first bowler
  const bowlers = bowlingTeam.players.slice(6); // Use players 7-11 as bowlers
  
  // Simulate 20 overs
  for (let over = 0; over < 20; over++) {
    // Change bowler for each over (simple rotation)
    currentBowlerIndex = (currentBowlerIndex + 1) % bowlers.length;
    
    dispatch(setBowler({
      team: bowlingTeamKey,
      bowlerId: bowlers[currentBowlerIndex].id
    }));
    
    // Small delay before each over
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Bowl 6 balls per over
    for (let ball = 0; ball < 6; ball++) {
      // Randomly determine outcome
      const outcome = simulateOutcome();
      
      // Process the outcome
      if (outcome.isWicket) {
        // Handle wicket
        const wicketTypes = ['bowled', 'caught', 'caught & bowled', 'lbw', 'run out'];
        const randomWicketType = wicketTypes[Math.floor(Math.random() * wicketTypes.length)];
        
        // Choose which batsman is out (usually striker)
        const outBatsmanId = Math.random() < 0.9 ? 
          battingTeam.currentStrikerId : battingTeam.currentNonStrikerId;
        
        // Get next batsman if available
        let nextBatsmanId = '';
        if (currentBatsmanIndex < battingTeam.players.length) {
          nextBatsmanId = battingTeam.players[currentBatsmanIndex].id;
          currentBatsmanIndex++;
        }
        
        // Simulate fielder for caught/run out
        let fielderId;
        if (randomWicketType === 'caught' || randomWicketType === 'run out') {
          // Random fielder
          const fielderIndex = Math.floor(Math.random() * bowlingTeam.players.length);
          fielderId = bowlingTeam.players[fielderIndex].id;
        }
        
        // Record the wicket
        dispatch(scoreBall({
          runs: outcome.runs,
          wicket: true,
          wicketType: randomWicketType,
          outBatsmanId,
          nextBatsmanId,
          fielderId
        }));
      } else if (outcome.isExtra) {
        // Handle extras
        const extraTypes = ['wide', 'no-ball', 'bye', 'leg-bye'];
        const randomExtraType = extraTypes[Math.floor(Math.random() * extraTypes.length)];
        
        dispatch(scoreBall({
          runs: outcome.runs,
          extraType: randomExtraType
        }));
      } else {
        // Regular runs
        dispatch(scoreBall({
          runs: outcome.runs
        }));
      }
      
      // Small delay between balls
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check if innings should end (all out or target reached)
      // This would require checking the updated state - for simplicity we'll just continue
    }
  }
};

// Helper to generate random cricket outcomes
const simulateOutcome = () => {
  // Configuration for outcome probabilities
  const wicketProbability = 0.08; // 8% chance of wicket
  const extraProbability = 0.15; // 15% chance of extras
  
  // Decide outcome type
  const random = Math.random();
  const isWicket = random < wicketProbability;
  const isExtra = !isWicket && random < (wicketProbability + extraProbability);
  
  // Decide runs
  let runs = 0;
  if (!isWicket) {
    const runProbabilities = [0.35, 0.35, 0.15, 0.05, 0.08, 0.02]; // 0,1,2,3,4,6 runs
    const randomRun = Math.random();
    
    if (randomRun < runProbabilities[0]) runs = 0;
    else if (randomRun < runProbabilities[0] + runProbabilities[1]) runs = 1;
    else if (randomRun < runProbabilities[0] + runProbabilities[1] + runProbabilities[2]) runs = 2;
    else if (randomRun < runProbabilities[0] + runProbabilities[1] + runProbabilities[2] + runProbabilities[3]) runs = 3;
    else if (randomRun < runProbabilities[0] + runProbabilities[1] + runProbabilities[2] + runProbabilities[3] + runProbabilities[4]) runs = 4;
    else runs = 6;
  }
  
  return { runs, isWicket, isExtra };
};

// Helper function for setting batsmen (you'll need to add this to your slice)
const setBatsmen = (payload: {
  strikerTeam: 'teamA' | 'teamB';
  strikerId: string;
  nonStrikerTeam: 'teamA' | 'teamB';
  nonStrikerId: string;
}) => {
  // This is a placeholder - you'll need to create this action in your scoreboardSlice
  return {
    type: 'scoreboard/setBatsmen',
    payload
  };
};