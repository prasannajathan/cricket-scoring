import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WicketToggleProps {
  wicket: boolean;
  setWicket: (value: boolean) => void;
  disabled?: boolean;
}

export default function WicketToggle({ wicket, setWicket, disabled = false }: WicketToggleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wicket:</Text>
      <TouchableOpacity
        style={[
          styles.toggle,
          wicket ? styles.activeToggle : null,
          disabled ? styles.disabledToggle : null
        ]}
        onPress={() => setWicket(!wicket)}
        disabled={disabled}
      >
        <Text style={[
          styles.toggleText,
          wicket ? styles.activeText : null,
          disabled ? styles.disabledText : null
        ]}>
          W
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  toggle: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D32F2F',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  activeToggle: {
    backgroundColor: '#D32F2F',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  activeText: {
    color: '#fff',
  },
  disabledToggle: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#ccc',
  }
});