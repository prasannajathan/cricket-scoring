import { Alert } from 'react-native';

/**
 * A simple helper to simulate a specific number of overs
 */
export const runMatchSimulation = (dispatch: any, onComplete?: (result: string) => void) => {
  Alert.alert(
    "Simulate Overs",
    "How many overs would you like to simulate?",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "5 Overs",
        onPress: () => simulateOvers(dispatch, 5, onComplete)
      },
      {
        text: "10 Overs",
        onPress: () => simulateOvers(dispatch, 10, onComplete)
      },
      {
        text: "20 Overs",
        onPress: () => simulateOvers(dispatch, 20, onComplete)
      }
    ]
  );
};

/**
 * Helper to simulate a specific number of overs with random scoring
 */
const simulateOvers = async (dispatch: any, numberOfOvers: number, onComplete?: (result: string) => void) => {
  try {
    Alert.alert("Simulation Started", `Simulating ${numberOfOvers} overs...`);
    
    let totalRuns = 0;
    let wickets = 0;
    
    // Run distribution for more realistic cricket scoring
    const runDistribution = [0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 4, 4, 6];
    
    // Simulate each ball
    for (let over = 0; over < numberOfOvers; over++) {
      // Notice no return after each over
      for (let ball = 0; ball < 6; ball++) {
        // Get a random outcome
        const randomIndex = Math.floor(Math.random() * runDistribution.length);
        const runs = runDistribution[randomIndex];
        
        // Small chance of wicket (5%)
        const isWicket = Math.random() < 0.05 && wickets < 9;
        
        // Small chance of extras (10%)
        const isExtra = !isWicket && Math.random() < 0.1;
        const extraTypes = ['wide', 'no-ball', 'bye', 'leg-bye'];
        const extraIndex = Math.floor(Math.random() * extraTypes.length);
        
        if (isWicket) {
          // Record wicket but continue simulation
          wickets++;
          dispatch({
            type: 'scoreboard/scoreBall',
            payload: { 
              runs: 0,
              wicket: true,
              wicketType: 'bowled',
              // Simplified wicket - you'd need to handle batsmen properly for a real simulation
              outBatsmanId: 'auto-simulation',
              nextBatsmanId: 'auto-simulation'
            }
          });
        } else if (isExtra) {
          // Score an extra
          dispatch({
            type: 'scoreboard/scoreBall',
            payload: { 
              runs: runs,
              extraType: extraTypes[extraIndex]
            }
          });
          
          if (extraTypes[extraIndex] === 'wide' || extraTypes[extraIndex] === 'no-ball') {
            totalRuns += runs + 1;
          } else {
            totalRuns += runs;
          }
        } else {
          // Normal runs
          dispatch({
            type: 'scoreboard/scoreBall',
            payload: { runs }
          });
          totalRuns += runs;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Inform user about over completion but continue
      console.log(`Completed over ${over+1}`);
    }
    
    Alert.alert(
      "Simulation Complete",
      `Simulated ${numberOfOvers} overs. Score: ${totalRuns}/${wickets}`,
      [{ text: "View Scorecard", onPress: () => onComplete?.(`Simulated ${numberOfOvers} overs`) }]
    );
  } catch (error) {
    console.error("Simulation error:", error);
    Alert.alert("Simulation Error", "An error occurred during simulation.");
  }
};