import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { InningsData, DeliveryEvent, Team } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface CommentaryFeedProps {
  innings: InningsData;
  battingTeam: Team;
  bowlingTeam: Team;
}

export default function CommentaryFeed({ innings, battingTeam, bowlingTeam }: CommentaryFeedProps) {
  if (!innings.deliveries || innings.deliveries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesome name="commenting" size={16} color={colors.brandDark} style={styles.headerIcon} />
          <Text style={styles.title}>Commentary</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome name="info-circle" size={24} color={colors.brandLight} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No deliveries yet</Text>
        </View>
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
  
  const getBowlerFielderName = (id?: string) => {
    if (!id) return 'Unknown';
    const player = bowlingTeam.players.find(p => p.id === id);
    return player?.name || 'Unknown';
  };


  // Get appropriate icon for delivery type
  const getDeliveryIcon = (delivery: DeliveryEvent) => {
    if (delivery.wicket) {
      return "trophy";
    } else if (delivery.extraType === 'wide') {
      return "arrows-h";
    } else if (delivery.extraType === 'no-ball') {
      return "times-circle";
    } else if (delivery.extraType === 'bye' || delivery.extraType === 'leg-bye') {
      return "share";
    } else if (delivery.runs === 4) {
      return "flag-checkered";
    } else if (delivery.runs === 6) {
      return "bolt";
    } else if (delivery.runs === 0) {
      return "dot-circle-o";
    } else {
      return "circle";
    }
  };

  // Get color for delivery type
  const getDeliveryColor = (delivery: DeliveryEvent) => {
    if (delivery.wicket) {
      return colors.brandRed;
    } else if (delivery.extraType) {
      return colors.orange;
    } else if (delivery.runs === 4) {
      return colors.brandBlue;
    } else if (delivery.runs === 6) {
      return colors.brandGreen;
    } else if (delivery.runs === 0) {
      return colors.brandLight;
    } else {
      return colors.brandDark;
    }
  };
  
  const formatCommentary = (delivery: DeliveryEvent) => {
    // Get array of all legal deliveries (excluding wides and no-balls)
    const legalDeliveries = innings.deliveries.filter(d => 
      !d.extraType || (d.extraType !== 'wide' && d.extraType !== 'no-ball')
    );
    
    // Find the index of the current delivery in all deliveries
    const deliveryIndex = innings.deliveries.indexOf(delivery);
    
    // Count legal deliveries up to this point
    let legalBallsBeforeThis = 0;
    for (let i = 0; i < deliveryIndex; i++) {
      if (!innings.deliveries[i].extraType || 
          (innings.deliveries[i].extraType !== 'wide' && 
           innings.deliveries[i].extraType !== 'no-ball')) {
        legalBallsBeforeThis++;
      }
    }
    
    // Calculate over and ball number
    const isLegalDelivery = !delivery.extraType || 
                            (delivery.extraType !== 'wide' && 
                             delivery.extraType !== 'no-ball');
    
    // For wides and no balls, use previous legal delivery's over.ball
    let overNumber, ballNumber;
    
    if (isLegalDelivery) {
      overNumber = Math.floor(legalBallsBeforeThis / 6);
      ballNumber = (legalBallsBeforeThis % 6) + 1;
    } else {
      // For extras, show the over they occurred in (based on previous legal delivery)
      overNumber = Math.floor(legalBallsBeforeThis / 6);
      ballNumber = (legalBallsBeforeThis % 6) + 1;
      
      // If it's the first ball of an over, show previous over's 6th ball
      if (ballNumber === 0 && overNumber > 0) {
        ballNumber = 6;
        overNumber -= 1;
      } else if (ballNumber === 0) {
        // Edge case: first ball of the innings is a wide/no-ball
        ballNumber = 1;
      }
    }
    
    const bowlerName = getBowlerFielderName(delivery.bowlerId);
    const batsmanName = getBatsmanName(delivery.batsmanId);
    
    let commentary = `${overNumber}.${ballNumber} ${bowlerName} to ${batsmanName}, `;
    
    // Rest of the function remains the same
    if (delivery.wicket) {
      commentary += `OUT! ${delivery.wicketType}`;
      if (delivery.wicketType === 'caught' && delivery.fielderId) {
        const fielderName = getBowlerFielderName(delivery.fielderId);
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

  // Function to highlight keywords in commentary
  const highlightCommentary = (text: string) => {
    // Keywords to highlight and their respective styles
    const keywords = [
      { word: 'OUT!', style: styles.wicketText },
      { word: 'WIDE', style: styles.extrasText },
      { word: 'NO BALL', style: styles.extrasText },
      { word: 'BYE', style: styles.extrasText },
      { word: 'BYES', style: styles.extrasText },
      { word: 'LEG BYE', style: styles.extrasText },
      { word: 'LEG BYES', style: styles.extrasText },
      { word: 'FOUR!', style: styles.boundaryText },
      { word: 'SIX!', style: styles.bigBoundaryText },
      { word: 'dot ball', style: styles.dotText },
    ];

    let parts: (string | React.ReactNode)[] = [text];

    // For each keyword, split and modify the parts array
    keywords.forEach(({ word, style }) => {
      parts = parts.flatMap(part => {
        if (typeof part === 'string') {
          const splitParts = part.split(new RegExp(`(${word})`, 'gi'));
          return splitParts.map((subPart, index) => 
            subPart.toLowerCase() === word.toLowerCase() ? 
              <Text key={index} style={style}>{subPart}</Text> : 
              subPart
          );
        }
        return part;
      });
    });

    return parts;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="commenting" size={16} color={colors.brandDark} style={styles.headerIcon} />
        <Text style={styles.title}>Commentary</Text>
      </View>
      <ScrollView 
        style={styles.commentaryScroll}
        showsVerticalScrollIndicator={false}
      >
        {recentDeliveries.map((delivery, index) => (
          <View key={index} style={styles.commentaryItem}>
            <View style={styles.ballIconContainer}>
              <View style={[styles.ballIcon, { backgroundColor: getDeliveryColor(delivery) }]}>
                <FontAwesome 
                  name={getDeliveryIcon(delivery)} 
                  size={12} 
                  color={colors.white} 
                />
              </View>
              <View style={styles.deliveryLine} />
            </View>
            <View style={styles.commentaryContent}>
              <Text style={styles.deliveryText}>
                {highlightCommentary(formatCommentary(delivery))}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    marginRight: spacing.xs,
  },
  title: {
    fontSize: typography.sizeLG,
    fontFamily: typography.fontFamilyBold,
    fontWeight: typography.weightBold,
    color: colors.brandDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizeMD,
    color: colors.brandLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  commentaryScroll: {
    maxHeight: 250,
  },
  commentaryItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandLight + '40', // 40% opacity
  },
  ballIconContainer: {
    alignItems: 'center',
    width: 30,
    marginRight: spacing.sm,
  },
  ballIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deliveryLine: {
    flex: 1,
    width: 1,
    backgroundColor: colors.brandLight,
  },
  commentaryContent: {
    flex: 1,
  },
  deliveryText: {
    fontSize: typography.sizeSM,
    lineHeight: typography.sizeSM * 1.4,
    color: colors.brandDark + 'E6', // 90% opacity
  },
  wicketText: {
    color: colors.brandRed,
    fontWeight: typography.weightBold,
  },
  extrasText: {
    color: colors.orange,
    fontWeight: typography.weightSemiBold,
  },
  boundaryText: {
    color: colors.brandBlue,
    fontWeight: typography.weightBold,
  },
  bigBoundaryText: {
    color: colors.brandGreen,
    fontWeight: typography.weightBold,
  },
  dotText: {
    color: colors.brandDark,
    fontStyle: 'italic',
  },
});