// Create new file components/ExtrasSelector.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ExtrasSelector = ({ onSelect, currentSelection }) => {
  const extras = ['wide', 'noBall', 'bye', 'legBye'];
  
  return (
    <View style={styles.container}>
      {extras.map((extra) => (
        <TouchableOpacity
          key={extra}
          style={[
            styles.button,
            currentSelection === extra && styles.selected
          ]}
          onPress={() => onSelect(extra)}
        >
          <Text style={styles.text}>{extra}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Add corresponding styles