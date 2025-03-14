import { StyleSheet } from 'react-native';
import {
    colors,
    spacing,
    typography,
    radius
} from '@/constants/theme';

export default StyleSheet.create({
    scorecardContainer: {
        marginBottom: 10,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.brandLight,
        borderRadius: radius.sm,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: colors.brandLight,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
    },
    tableHeader: {
        flex: 1,
        color: colors.brandBlue,
        fontFamily: typography.fontFamilyBold,
        fontSize: typography.sizeSM,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        fontWeight: '600',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
    },
    tableCell: {
        flex: 1,
        color: colors.black,
        fontFamily: typography.fontFamilyRegular,
        fontSize: typography.sizeSM,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    highlightedCell: {
        color: colors.brandBlue,
        fontWeight: typography.weightBold,
    },
    playerColumn: {
        flex: 3,
    },
    lastColumn: {
        flex: 1.5,
    },
});