import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCurrentInnings } from '@/store/cricket/selectors';
import { DeliveryEvent, InningsData } from '@/types';
import { colors, spacing, typography, commonStyles } from '@/constants/theme';
import sStyles from '@/styles/overExtraWicketRows';

export default function OverRowDisplay() {
  const currentInnings = useSelector(selectCurrentInnings);

  // Get the current over balls
  const currentOverBalls = getCurrentOverBalls(currentInnings);

  // Format the data for display
  const formattedBalls = currentOverBalls.map(ball => formatDeliveryForDisplay(ball));

  return (
    <View style={sStyles.sectionHeaderRow}>
      <Text style={commonStyles.sectionTitle}>This Over</Text>
      <View style={styles.overBallsRow}>
        {formattedBalls.length > 0 ? (
          formattedBalls.map((ball, index) => (
            <View key={index} style={[
              styles.ballCircle,
              getBallStyle(ball)
            ]}>
              <Text style={styles.ballText}>{ball}</Text>
            </View>
          ))
        ) : (
          <Text>New over</Text>
        )}
      </View>
    </View>
  );
}

// Improved function to correctly identify current over balls
function getCurrentOverBalls(innings: InningsData): DeliveryEvent[] {
  if (!innings || !innings.deliveries || innings.deliveries.length === 0) {
    return [];
  }

  // IMPROVED LOGIC: We need to identify the current over more reliably
  // by looking at deliveries and completed overs together
  
  // First, calculate which over number each delivery belongs to
  const deliveriesWithOverNumber: Array<{delivery: DeliveryEvent, overNumber: number}> = [];
  let currentOver = 0;
  let legalDeliveriesInCurrentOver = 0;

  // Assign over numbers to each delivery
  innings.deliveries.forEach(delivery => {
    const isLegalDelivery = !delivery.extraType || 
                           delivery.extraType === 'bye' || 
                           delivery.extraType === 'leg-bye';

    // Add this delivery with its calculated over number
    deliveriesWithOverNumber.push({
      delivery,
      overNumber: currentOver
    });

    // Update over counter if needed
    if (isLegalDelivery) {
      legalDeliveriesInCurrentOver++;
      
      // Check if this completes an over
      if (legalDeliveriesInCurrentOver === 6) {
        currentOver++;
        legalDeliveriesInCurrentOver = 0;
      }
    }
  });

  // Now determine which over to show - IMPROVED LOGIC
  let overToShow: number;
  
  // If we have at least one delivery
  if (deliveriesWithOverNumber.length > 0) {
    // Look at the last delivery to determine current over
    const lastDeliveryOver = deliveriesWithOverNumber[deliveriesWithOverNumber.length - 1].overNumber;
    
    // This is the current over we're in (regardless of legal/illegal deliveries)
    overToShow = lastDeliveryOver;
  } else {
    // No deliveries yet, show over 0
    overToShow = 0;
  }

  // Filter and return only the deliveries from our target over
  return deliveriesWithOverNumber
    .filter(item => item.overNumber === overToShow)
    .map(item => item.delivery);
}

// UPDATED function to correctly display wide balls
function formatDeliveryForDisplay(delivery: DeliveryEvent): string {
  if (!delivery) return "";

  // Handle wickets with appropriate notation
  if (delivery.wicket) {
    return "W";
  }

  // Handle extras
  if (delivery.extraType) {
    switch (delivery.extraType) {
      case 'wide':
        // For wides, show total runs including the penalty
        // For a standard wide (1 run), just show "Wd"
        // For a wide with additional runs, show the total: "2Wd", "3Wd", etc.
        if (delivery.totalRuns === 1) {
          return 'Wd';
        } else {
          return `${delivery.totalRuns}Wd`;
        }

      case 'no-ball':
        // For no-balls, show batsman runs (if any) followed by Nb
        return delivery.batsmanRuns > 0 ? `${delivery.batsmanRuns}Nb` : 'Nb';

      case 'bye':
        return `${delivery.runs}B`;

      case 'leg-bye':
        return `${delivery.runs}Lb`;

      default:
        return `${delivery.runs}`;
    }
  }

  // Regular runs
  if (delivery.runs === 0) {
    return "0"; // Dot ball
  }
  return delivery.runs.toString();
}

// Helper to get ball style based on value
function getBallStyle(ball: string) {
  if (ball === 'W') return styles.wicketBall;
  if (ball.includes('Wd') || ball.includes('Nb')) return styles.extraBall;
  if (ball.includes('B') || ball.includes('Lb')) return styles.byeBall;
  if (ball === '4') return styles.fourBall;
  if (ball === '6') return styles.sixBall;
  return styles.regularBall;
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  regularBall: {
    backgroundColor: '#E0E0E0',
  },
  wicketBall: {
    backgroundColor: '#D32F2F',
  },
  extraBall: {
    backgroundColor: '#FF9800',
  },
  byeBall: {
    backgroundColor: '#9C27B0',
  },
  fourBall: {
    backgroundColor: '#2196F3',
  },
  sixBall: {
    backgroundColor: '#4CAF50',
  },
});