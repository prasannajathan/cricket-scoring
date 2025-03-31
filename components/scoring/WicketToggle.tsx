import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  colors,
  spacing,
  typography,
  radius,
  commonStyles
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
      <View style={styles.labelContainer}>
        <Text style={[
          commonStyles.sectionTitle,
          disabled ? styles.disabledLabel : null
        ]}>
          Wicket
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.wicketBox,
          wicket ? styles.activeToggle : null,
          disabled ? styles.disabledToggle : null
        ]}
        onPress={() => setWicket(!wicket)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {wicket ? (
          <View style={styles.activeInner}>
            <FontAwesome name="check" size={14} color={colors.white} />
            <Text style={[styles.wicketBoxText, styles.activeText]}>W</Text>
          </View>
        ) : (
          <Text style={[
            styles.wicketBoxText,
            disabled ? styles.disabledText : null
          ]}>
            W
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  wicketBox: {
    borderWidth: 2,
    borderColor: colors.brandRed,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activeToggle: {
    backgroundColor: colors.brandRed,
    borderColor: colors.brandRed,
  },
  activeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeText: {
    color: colors.white,
    marginLeft: spacing.xs,
  },
  wicketBoxText: {
    color: colors.brandRed,
    fontWeight: typography.weightBold,
    fontSize: 16,
  },
  disabledToggle: {
    borderColor: colors.ccc,
    backgroundColor: colors.brandLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: colors.ccc,
  },
  disabledLabel: {
    color: colors.ccc,
  }
});