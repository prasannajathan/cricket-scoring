import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  commonStyles,
} from '@/constants/theme';

const ModernCricketScoringScreen = () => {
  return (
    <ScrollView style={styles.container}>

      {/* Hero Scoreboard Section */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={require('@/assets/images/stadium-1.png')} // or another image
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.teamName}>Team A</Text>
            <Text style={styles.score}>3 - 0</Text>
            <View style={styles.subInfoRow}>
              <Text style={styles.subInfoText}>Overs: 0.3</Text>
              <Text style={styles.subInfoText}>CRR: 6.00</Text>
              <Text style={styles.subInfoText}>P'SHIP: 9(14)</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Batting Card */}
      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Batting</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeader}>Batter</Text>
          <Text style={styles.tableHeader}>R</Text>
          <Text style={styles.tableHeader}>B</Text>
          <Text style={styles.tableHeader}>4s</Text>
          <Text style={styles.tableHeader}>6s</Text>
          <Text style={styles.tableHeader}>SR</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.highlightedCell]}>B *</Text>
          <Text style={styles.tableCell}>2</Text>
          <Text style={styles.tableCell}>2</Text>
          <Text style={styles.tableCell}>0</Text>
          <Text style={styles.tableCell}>0</Text>
          <Text style={styles.tableCell}>100.0</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>A</Text>
          <Text style={styles.tableCell}>1</Text>
          <Text style={styles.tableCell}>1</Text>
          <Text style={styles.tableCell}>0</Text>
          <Text style={styles.tableCell}>0</Text>
          <Text style={styles.tableCell}>100.0</Text>
        </View>
      </View>

      {/* Bowling Card */}
      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Bowling</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeader}>Bowler</Text>
          <Text style={styles.tableHeader}>O</Text>
          <Text style={styles.tableHeader}>M</Text>
          <Text style={styles.tableHeader}>R</Text>
          <Text style={styles.tableHeader}>W</Text>
          <Text style={styles.tableHeader}>Econ</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>C</Text>
          <Text style={styles.tableCell}>0.3</Text>
          <Text style={styles.tableCell}>m</Text>
          <Text style={styles.tableCell}>3</Text>
          <Text style={styles.tableCell}>0</Text>
          <Text style={styles.tableCell}>6.00</Text>
        </View>
      </View>

      {/* This Over, Extras, Wicket - group them in a card */}
      <View style={commonStyles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>This Over</Text>
          <View style={styles.overBallsRow}>
            <View style={styles.ballCircle}>
              <Text style={styles.ballText}>1</Text>
            </View>
            <View style={styles.ballCircle}>
              <Text style={styles.ballText}>2</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Extras</Text>
          <View style={styles.extrasRow}>
            <View style={styles.extraChip}>
              <Text style={styles.extraChipText}>Wide</Text>
            </View>
            <View style={styles.extraChip}>
              <Text style={styles.extraChipText}>No Ball</Text>
            </View>
            <View style={styles.extraChip}>
              <Text style={styles.extraChipText}>Bye</Text>
            </View>
            <View style={styles.extraChip}>
              <Text style={styles.extraChipText}>Leg Bye</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Wicket</Text>
          <View style={styles.wicketBox}>
            <Text style={styles.wicketBoxText}>W</Text>
          </View>
        </View>
      </View>

      {/* Scoring Buttons Card */}
      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Scoring</Text>
        <View style={styles.scoringRow}>
          <TouchableOpacity style={[styles.runButton, { backgroundColor: '#106400' }]}>
            <Text style={styles.runButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.runButton, { backgroundColor: '#106400' }]}>
            <Text style={styles.runButtonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.runButton, { backgroundColor: '#106400' }]}>
            <Text style={styles.runButtonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.runButton, { backgroundColor: '#FFA000' }]}>
            <Text style={styles.runButtonText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.runButton, { backgroundColor: '#FFA000' }]}>
            <Text style={styles.runButtonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.runButton, { backgroundColor: colors.brandRed }]}>
            <Text style={styles.runButtonText}>6</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Actions Card */}
      <View style={commonStyles.card}>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.brandDark }]}>
            <Text style={styles.actionButtonText}>Penalty</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.brandRed }]}>
            <Text style={styles.actionButtonText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Partnership</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Extras</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.actionButtonLarge, { backgroundColor: colors.brandDark }]}>
          <Text style={styles.actionButtonText}>Change Bowler</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },

  /* Hero Scoreboard */
  heroContainer: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  heroImage: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', // subtle dark overlay
  },
  heroContent: {
    padding: spacing.md,
  },
  teamName: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeLG,
    color: colors.white,
    fontWeight: typography.weightBold,
  },
  score: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeXL,
    color: colors.white,
    marginTop: spacing.xs,
    fontWeight: typography.weightBold,
  },
  subInfoRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  subInfoText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.sizeSM,
    color: colors.white,
    marginRight: spacing.md,
  },

  /* Section Titles */
  sectionTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeMD,
    fontWeight: typography.weightBold,
    color: colors.brandDark,
    marginBottom: spacing.sm,
  },

  /* Table styling */
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.brandLight,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  tableHeader: {
    flex: 1,
    textAlign: 'center',
    color: colors.brandBlue,
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeSM,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: spacing.xs,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: colors.black,
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.sizeSM,
  },
  highlightedCell: {
    color: colors.brandBlue,
    fontWeight: typography.weightBold,
  },

  /* This Over, Extras, Wicket layout */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  overBallsRow: {
    flexDirection: 'row',
  },
  ballCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  ballText: {
    color: colors.black,
    fontWeight: typography.weightBold,
    fontSize: typography.sizeXS,
  },
  extrasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 200,
  },
  extraChip: {
    backgroundColor: '#E5FCE5',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  extraChipText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.sizeXS,
    color: colors.brandDark,
  },
  wicketBox: {
    borderWidth: 1,
    borderColor: colors.brandRed,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  wicketBoxText: {
    color: colors.brandRed,
    fontWeight: typography.weightBold,
  },

  /* Scoring Buttons */
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runButton: {
    flex: 1,
    marginRight: spacing.xs,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeMD,
  },

  /* Actions (Penalty, Undo, etc.) */
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: colors.brandBlue,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  actionButtonLarge: {
    width: '100%',
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  actionButtonText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeSM,
    color: colors.white,
    fontWeight: typography.weightSemiBold,
  },
});

export default ModernCricketScoringScreen;