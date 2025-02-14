import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

interface ScoreControlsProps {
  onRun: (runs: number) => void;
}

const ScoreControls: React.FC<ScoreControlsProps> = ({ onRun }) => {
  return (
    <View style={styles.container}>
      <View style={styles.runRow}>
        {[0, 1, 2, 3, 4, 5, 6].map((run) => (
          <Button key={run} title={`${run}`} onPress={() => onRun(run)} />
        ))}
      </View>

      {/* Additional checkboxes for Wide, No Ball, Byes, Leg Byes, Wicket, etc.
          could go here, or be separate components. */}
    </View>
  );
};

export default ScoreControls;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  runRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});