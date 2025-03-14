import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  colors,
  spacing,
  typography, radius, commonStyles
} from '@/constants/theme';
import sStyles from '@/styles/overExtraWicketRows';
interface WicketToggleProps {
  wicket: boolean;
  setWicket: (value: boolean) => void;
  disabled?: boolean;
}

export default function WicketToggle({ wicket, setWicket, disabled = false }: WicketToggleProps) {
  return (
    <View style={sStyles.sectionHeaderRow}>
      <Text style={commonStyles.sectionTitle}>Wicket</Text>
      <TouchableOpacity
        style={[
          styles.wicketBox,
          wicket ? styles.activeToggle : null,
          disabled ? styles.disabledToggle : null
        ]}
        onPress={() => setWicket(!wicket)}
        disabled={disabled}
      >
        <Text style={[
          styles.wicketBoxText,
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
  wicketBox: {
    borderWidth: 1,
    borderColor: colors.brandRed,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activeToggle: {
    backgroundColor: colors.black,
  },
  activeText: {
    color: colors.white,
  },
  wicketBoxText: {
    color: colors.brandRed,
    fontWeight: typography.weightBold,
  },
  disabledToggle: {
    borderColor: colors.ccc,
    backgroundColor: colors.brandLight,
  },
  disabledText: {
    color: colors.ccc,
  }
});