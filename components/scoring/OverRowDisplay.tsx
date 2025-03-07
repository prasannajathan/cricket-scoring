import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectCurrentInnings } from '@/store/cricket/selectors';
import { DeliveryEvent, InningsData } from '@/types';

export default function OverRowDisplay() {
  const currentInnings = useSelector(selectCurrentInnings);
  
  // Get the current over balls
  const currentOverBalls = getCurrentOverBalls(currentInnings);

  // Format the data for display
  const formattedBalls = currentOverBalls.map(ball => formatDeliveryForDisplay(ball));
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Over</Text>
      <View style={styles.ballsContainer}>
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
          <Text style={styles.noBallsText}>New over</Text>
        )}
      </View>
    </View>
  );
}

// Helper to get current over balls
function getCurrentOverBalls(innings: InningsData): DeliveryEvent[] {
  if (!innings || !innings.deliveries || innings.deliveries.length === 0) {
    return [];
  }
  
  // If we have balls in the current over, show this over
  // Otherwise, show the previous over
  const overNumber = innings.ballInCurrentOver > 0 ? 
    innings.completedOvers : 
    innings.completedOvers - 1;
  
  // Ensure we don't go below 0
  const overToShow = Math.max(0, overNumber);
  
  // Get the balls from this over
  return innings.deliveries.filter(delivery => {
    // First, we need to tag each delivery with its over number
    let overCount = 0;
    let ballCount = 0;
    
    // Find this delivery's index
    const index = innings.deliveries.indexOf(delivery);
    
    // Count legal balls up to this delivery to determine its over
    for (let i = 0; i <= index; i++) {
      const d = innings.deliveries[i];
      const isLegal = !d.extraType || (d.extraType !== 'wide' && d.extraType !== 'no-ball');
      
      if (isLegal) {
        ballCount++;
        if (ballCount > 6) {
          overCount++;
          ballCount = 1;
        }
      }
    }
    
    return overCount === overToShow;
  });
}

// Helper to format ball for display
// function formatBallDisplay(ball: DeliveryEvent): string {
//   if (ball.wicket) return 'W';
  
//   if (ball.extraType === 'wide') {
//     return ball.runs > 1 ? `${ball.runs-1}Wd` : 'Wd';
//   }
  
//   if (ball.extraType === 'no-ball') {
//     return ball.batsmanRuns > 0 ? `${ball.batsmanRuns}Nb` : 'Nb';
//   }
  
//   if (ball.extraType === 'bye') {
//     return `${ball.runs}B`;
//   }
  
//   if (ball.extraType === 'leg-bye') {
//     return `${ball.runs}Lb`;
//   }
  
//   return ball.runs.toString();
// }
function formatDeliveryForDisplay(delivery: DeliveryEvent) {
  if (!delivery) return "";

  // Handle wickets with appropriate notation
  if (delivery.wicket) {
    return "W";
  }

  // Handle extras
  if (delivery.extraType) {
    const runsDisplay = delivery.runs > 0 ? delivery.runs : "";
    
    switch (delivery.extraType) {
      case 'wide':
        // For wides, show total runs (including penalty) followed by 'Wd'
        // A wide with 1 extra run would be displayed as '2Wd'
        return `${delivery.runs + 1}Wd`;
      
      case 'no-ball':
        // For no-balls, show 'Nb' and any batsman runs
        return delivery.runs > 0 ? `${runsDisplay}Nb` : 'Nb';
      
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
    return "."; // Dot ball
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
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 6,
  },
  ballsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ballCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 4,
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
  ballText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noBallsText: {
    fontStyle: 'italic',
    color: '#9E9E9E',
  },
});