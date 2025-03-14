// theme.js
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const colors = {
  brandDark: '#403940',    // deep grey/plum
  brandBlue: '#1570BF',    // saturated blue
  brandRed: '#F20505',     // bright red
  brandLight: '#F2F2F2',   // Elight grey
  brandCharcoal: '#262626',// dark grey
  black: '#000000',
  white: '#FFFFFF',
};

// #f5f5f5 

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
};

/**
 * Typography
 * Define a simple typescale, or pick a custom font.
 */
export const typography = {
  fontFamilyRegular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  fontFamilyBold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),

  /* Font sizes */
  sizeXS: 12,
  sizeSM: 14,
  sizeMD: 16,
  sizeLG: 20,
  sizeXL: 24,
  sizeXXL: 32,

  /* Weights */
  weightRegular: '400',
  weightSemiBold: '600',
  weightBold: '700',
};

/**
 * Shadows
 * iOS uses shadow properties, Android uses elevation.
 * A simple approach is to define shadow styles and apply them conditionally.
 */
export const shadows = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  // Add more shadow levels if needed
};

/**
 * Breakpoints (optional)
 * If you want to adapt layouts at certain screen widths.
 */
export const breakpoints = {
  smallPhone: 320,
  phone: 375,
  tablet: 768,
  largeTablet: 1024,
};

/**
 * Commonly used styles
 * You can define a few shared style objects for easy re-use
 */
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.brandLight,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  heading: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeLG,
    fontWeight: typography.weightBold,
    color: colors.brandCharcoal,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.sizeMD,
    fontWeight: typography.weightRegular,
    color: colors.black,
  },
  button: {
    backgroundColor: colors.brandBlue,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizeMD,
    fontWeight: typography.weightSemiBold,
    color: colors.white,
  },
};