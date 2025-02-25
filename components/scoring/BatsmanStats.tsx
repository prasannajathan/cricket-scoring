import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BatsmanStatsProps {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
}

export const BatsmanStats: React.FC<BatsmanStatsProps> = ({
    runs,
    balls,
    fours,
    sixes
}) => {
    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';

    return (
        <View style={styles.container}>
            <View style={styles.statItem}>
                <Text style={styles.runs}>{runs}</Text>
                <Text style={styles.label}>({balls})</Text>
            </View>
            <View style={styles.boundaries}>
                <Text style={styles.boundaryText}>4s: {fours}</Text>
                <Text style={styles.boundaryText}>6s: {sixes}</Text>
            </View>
            <Text style={styles.strikeRate}>SR: {strikeRate}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginRight: 12,
    },
    runs: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 4,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    boundaries: {
        flexDirection: 'row',
        marginRight: 12,
    },
    boundaryText: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    strikeRate: {
        fontSize: 14,
        color: '#666',
    },
});