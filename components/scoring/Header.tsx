import React from 'react'
import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '@/constants/theme';

export default function Header() {
    return (
        <View style={styles.header}>
            <Text style={styles.logo}>CricScoring</Text>
        </View>
    )
}

const styles = StyleSheet.create({
header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
    ...shadows.card
  },
  logo: {
    fontSize: typography.sizeLG,
    fontWeight: typography.weightBold,
    color: colors.brandBlue,
  },
})
