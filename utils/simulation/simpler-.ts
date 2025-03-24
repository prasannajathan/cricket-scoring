import { Alert } from 'react-native';

/**
 * A simpler test helper for cricket match testing
 */
export const runMatchSimulation = (dispatch: any, onComplete?: (result: string) => void) => {
  Alert.alert(
    "Testing Options",
    "Select a test scenario:",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Score 100 Runs",
        onPress: () => {
          // Score 100 runs in increments of 4
          const scoreRuns = async () => {
            for (let i = 0; i < 25; i++) {
              dispatch({
                type: 'scoreboard/scoreBall',
                payload: { runs: 4 }
              });
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            Alert.alert("Done", "Scored 100 runs");
            if (onComplete) onComplete("Scored 100 runs");
          };
          scoreRuns();
        }
      },
      {
        text: "Take 5 Wickets",
        onPress: () => {
          Alert.alert(
            "Not Implemented",
            "This would require UI interaction for selecting batsmen and fielders"
          );
        }
      },
      {
        text: "Bowl 10 Overs",
        onPress: () => {
          // Score 10 overs of dot balls
          const bowlOvers = async () => {
            for (let over = 0; over < 10; over++) {
              for (let ball = 0; ball < 6; ball++) {
                dispatch({
                  type: 'scoreboard/scoreBall',
                  payload: { runs: 0 }
                });
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              // After each over, you might need to select a new bowler in the UI
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            Alert.alert("Done", "Bowled 10 overs");
            if (onComplete) onComplete("Bowled 10 overs");
          };
          bowlOvers();
        }
      }
    ]
  );
};