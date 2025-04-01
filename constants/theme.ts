// theme.js
import { Platform, StyleSheet } from 'react-native';

export const colors = {
    brandDark: '#403940',    // deep grey/plum
    brandBlue: '#1570BF',    // saturated blue
    brandRed: '#F20505',     // bright red
    brandLight: '#F2F2F2',   // Elight grey
    brandCharcoal: '#262626',// dark grey
    black: '#000000',
    white: '#FFFFFF',
    ccc: '#cccccc',
    brandGreen: '#106400',
    brandTeal: '#008080',
    orange: '#FFA000',
    completedBadge: '#A0A0A0',
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
    weightRegular: '400' as '400',
    weightSemiBold: '600' as '600',
    weightBold: '700' as '700',
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
                shadowOffset: { width: 0, height: 5 },
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    modal: {
        ...Platform.select({
            ios: {
                shadowColor: colors.black,
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 10 },
                shadowRadius: 6,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    subtle: {
        ...Platform.select({
            ios: {
                shadowColor: colors.black,
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 1,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    button: {
        ...Platform.select({
            ios: {
                shadowColor: colors.black,
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
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
export const commonStyles =  StyleSheet.create({
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
    buttonLg: {
        backgroundColor: colors.brandBlue,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        marginTop: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonLgText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '600',
    },
    sectionTitle: {
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeSM,
        fontWeight: typography.weightBold,
        color: colors.brandCharcoal,
        marginBottom: spacing.sm,
    },
    pageTitle: {
        fontSize: typography.sizeLG,
        fontWeight: typography.weightBold,
        color: colors.brandDark,
        // marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: typography.sizeSM,
        fontWeight: typography.weightSemiBold,
        color: colors.brandDark,
        marginBottom: spacing.xs,
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: spacing.lg,
        zIndex: 1,
    },
    textInput: {
        borderWidth: 1,
        borderColor: colors.ccc,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
        backgroundColor: colors.white,
        fontSize: 16,
        color: colors.brandDark,
    },
    disabledInput: {
        backgroundColor: colors.brandLight,
        color: colors.ccc,
    },
});