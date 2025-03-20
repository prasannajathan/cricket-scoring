import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { InningsData, DeliveryEvent, Team } from '@/types';
import { colors, spacing, typography } from '@/constants/theme';

interface CommentaryFeedProps {
  innings: InningsData;
  battingTeam: Team;
  bowlingTeam: Team;
}

export default function CommentaryFeed({ innings, battingTeam, bowlingTeam }: CommentaryFeedProps) {
  if (!innings.deliveries || innings.deliveries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Commentary</Text>
        <Text style={styles.emptyText}>No deliveries yet</Text>
      </View>
    );
  }
  
  // Get last 10 deliveries in reverse (most recent first)
  const recentDeliveries = [...innings.deliveries]
    .reverse()
    .slice(0, 10);
  
  // Helper functions to get player names
  const getBatsmanName = (id?: string) => {
    if (!id) return 'Unknown';
    const player = battingTeam.players.find(p => p.id === id);
    return player?.name || 'Unknown';
  };
  
  const getBowlerName = (id?: string) => {
    if (!id) return 'Unknown';
    const player = bowlingTeam.players.find(p => p.id === id);
    return player?.name || 'Unknown';
  };
  
  const formatCommentary = (delivery: DeliveryEvent) => {
    // Calculate over number
    const legalBallIndex = innings.deliveries.filter(d => 
      !d.extraType || (d.extraType !== 'wide' && d.extraType !== 'no-ball')
    ).indexOf(delivery);
    
    const overNumber = Math.floor(legalBallIndex / 6);
    const ballNumber = (legalBallIndex % 6) + 1;
    
    const bowlerName = getBowlerName(delivery.bowlerId);
    const batsmanName = getBatsmanName(delivery.batsmanId);
    
    let commentary = `${overNumber}.${ballNumber} ${bowlerName} to ${batsmanName}, `;
    
    if (delivery.wicket) {
      commentary += `OUT! ${delivery.wicketType}`;
      if (delivery.wicketType === 'caught' && delivery.fielderId) {
        const fielderName = getBowlerName(delivery.fielderId);
        commentary += ` by ${fielderName}`;
      }
    } else if (delivery.extraType) {
      switch (delivery.extraType) {
        case 'wide':
          commentary += `WIDE, ${delivery.totalRuns} runs`;
          break;
        case 'no-ball':
          commentary += `NO BALL, ${delivery.totalRuns} runs`;
          break;
        case 'bye':
          commentary += `${delivery.runs} BYE${delivery.runs > 1 ? 'S' : ''}`;
          break;
        case 'leg-bye':
          commentary += `${delivery.runs} LEG BYE${delivery.runs > 1 ? 'S' : ''}`;
          break;
      }
    } else {
      // Regular delivery
      if (delivery.runs === 0) {
        commentary += "dot ball";
      } else if (delivery.runs === 4) {
        commentary += "FOUR!";
      } else if (delivery.runs === 6) {
        commentary += "SIX!";
      } else {
        commentary += `${delivery.runs} run${delivery.runs > 1 ? 's' : ''}`;
      }
    }
    
    return commentary;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Commentary</Text>
      <ScrollView style={styles.commentaryScroll}>
        {recentDeliveries.map((delivery, index) => (
          <View key={index} style={styles.commentaryItem}>
            <Text style={styles.deliveryText}>{formatCommentary(delivery)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.sizeLG,
    fontWeight: 'bold',
    color: colors.brandDark,
    marginBottom: spacing.sm,
  },
  commentaryScroll: {
    maxHeight: 200,
  },
  commentaryItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight,
  },
  deliveryText: {
    fontSize: typography.sizeSM,
    color: colors.brandDark,
  },
  emptyText: {
    fontSize: typography.sizeMD,
    color: colors.brandLight,
    fontStyle: 'italic',
  }
});