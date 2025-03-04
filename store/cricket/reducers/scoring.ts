import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState, ScoreBallPayload } from '@/types';
import { checkInningsCompletionHelper, calculateRemainingWickets } from '@/utils';

export const scoringReducers = {
    scoreBall: (state: ScoreboardState, action: PayloadAction<ScoreBallPayload>) => {
        console.log("scoreBall action:", {
            runs: action.payload.runs,
            extraType: action.payload.extraType,
            wicket: action.payload.wicket,
            currentInning: state.currentInning,
            currentTotal: state.currentInning === 2 ? state.innings2.totalRuns : state.innings1.totalRuns,
            targetScore: state.targetScore,
            matchOver: state.matchOver
        });
        
        // If match is already over, don't allow more scoring
        if (state.matchOver) {
            console.log("Match already over, ignoring ball");
            return;
        }
        
        // Get current innings and teams
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];

        const { runs, extraType, wicket, outBatsmanId, wicketType } = action.payload;
        let totalRuns = runs;
        let legalDelivery = true;

        // Update batsman stats
        if (!extraType || extraType === 'no-ball') {
            const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
            if (striker) {
                striker.runs += runs;
                striker.balls += 1;
                if (runs === 4) striker.fours += 1;
                if (runs === 6) striker.sixes += 1;
                striker.strikeRate = (striker.runs / striker.balls) * 100;
            }
        }

        // Handle extras
        if (extraType === 'wide' || extraType === 'no-ball') {
            totalRuns += 1;
            currentInnings.extras += 1;
            legalDelivery = false;
        } else if (extraType === 'bye' || extraType === 'leg-bye') {
            currentInnings.extras += runs;
        }

        // Update bowler stats - FIX HERE
        const bowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);
        if (bowler) {
            // For wides, only count as extras, not as bowler's runs
            if (extraType === 'wide') {
                // Don't increment bowler's runs for wide balls
                // Don't increment bowler's balls for wide balls
            } 
            // For no-balls, count the penalty run against the bowler
            else if (extraType === 'no-ball') {
                bowler.runsConceded += 1; // Just the no-ball penalty
                // Don't increment ballsThisOver for no-balls
                // If there are batsman runs on a no-ball, add them separately
                if (runs > 0) {
                    bowler.runsConceded += runs;
                }
            }
            // For byes/leg-byes, count the ball but not the runs
            else if (extraType === 'bye' || extraType === 'leg-bye') {
                // Count the ball but not the runs
                bowler.ballsThisOver += 1;
                // Don't add runs to bowler's runsConceded
            }
            // For regular deliveries or batsman runs off no-balls
            else {
                bowler.runsConceded += totalRuns;
                if (legalDelivery) {
                    bowler.ballsThisOver += 1;
                }
            }
            
            // Update economy rate if balls have been bowled
            const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
            if (totalBalls > 0) {
                bowler.economy = (bowler.runsConceded / (totalBalls / 6));
            }
            
            // Handle wicket attribution
            if (wicket && !['runout', 'retired'].includes(wicketType || '')) {
                bowler.wickets += 1;
            }
        }

        // Update innings total
        currentInnings.totalRuns += totalRuns;
        
        // Check for target reached BEFORE handling ball count
        if (state.currentInning === 2 && state.targetScore && currentInnings.totalRuns >= state.targetScore) {
            console.log("Target reached!", {
                totalRuns: currentInnings.totalRuns,
                targetScore: state.targetScore,
                battingTeam: battingTeam.teamName
            });
            
            // Match is won by the batting team
            currentInnings.isCompleted = true;
            state.matchOver = true;
            
            // Calculate the margin of victory (by wickets)
            // Use the actual number of active batsmen for accurate calculation
            const totalWickets = battingTeam.players.filter(p => !p.isRetired).length - 1;
            const remainingWickets = calculateRemainingWickets(battingTeam, currentInnings.wickets);
            
            // Set the match result
            state.matchResult = `${battingTeam.teamName} wins by ${remainingWickets} wickets`;
            
            // Just record the delivery and return
            currentInnings.deliveries.push({
                runs,
                batsmanRuns: extraType === 'bye' || extraType === 'leg-bye' ? 0 : runs,
                extraType,
                wicket: wicket || false,
                outBatsmanId,
                wicketType,
                bowlerId: currentInnings.currentBowlerId!,
                batsmanId: currentInnings.currentStrikerId!,
                timestamp: Date.now()
            });
            
            // Add an alert message to state for the UI to display
            state.alertMessage = `${battingTeam.teamName} has won the match by ${remainingWickets} wickets!`;
            
            console.log("Match completed, result set:", state.matchResult);
            
            // Stop processing - match is over
            return;
        }

        // Handle ball count and over completion - only if match isn't over
        if (legalDelivery) {
            currentInnings.ballInCurrentOver += 1;
            if (currentInnings.ballInCurrentOver >= 6) {
                currentInnings.completedOvers += 1;
                currentInnings.ballInCurrentOver = 0;
                currentInnings.lastOverBowlerId = currentInnings.currentBowlerId;

                // Always swap batsmen at end of over
                const temp = currentInnings.currentStrikerId;
                currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
                currentInnings.currentNonStrikerId = temp;

                // Update team state as well
                battingTeam.currentStrikerId = currentInnings.currentStrikerId;
                battingTeam.currentNonStrikerId = currentInnings.currentNonStrikerId;

                if (bowler) {
                    bowler.overs += 1;
                    bowler.ballsThisOver = 0;
                }

                // Check for innings completion
                if (state.currentInning === 1 && currentInnings.completedOvers >= state.totalOvers) {
                    currentInnings.isCompleted = true;
                }
            } else if (runs % 2 === 1) {
                // Swap for odd runs on legal deliveries
                const temp = currentInnings.currentStrikerId;
                currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
                currentInnings.currentNonStrikerId = temp;

                // Update team state as well
                battingTeam.currentStrikerId = currentInnings.currentStrikerId;
                battingTeam.currentNonStrikerId = currentInnings.currentNonStrikerId;
            }
        } else if (extraType === 'wide' || extraType === 'no-ball') {
            // For wides and no-balls with runs, swap if odd total
            if (totalRuns % 2 === 1) {
                const temp = currentInnings.currentStrikerId;
                currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
                currentInnings.currentNonStrikerId = temp;

                // Update team state as well
                battingTeam.currentStrikerId = currentInnings.currentStrikerId;
                battingTeam.currentNonStrikerId = currentInnings.currentNonStrikerId;
            }
        }

        // Record delivery
        currentInnings.deliveries.push({
            runs,
            batsmanRuns: extraType === 'bye' || extraType === 'leg-bye' ? 0 : runs,
            extraType,
            wicket: wicket || false,
            outBatsmanId,
            wicketType,
            bowlerId: currentInnings.currentBowlerId!,
            batsmanId: currentInnings.currentStrikerId!,
            timestamp: Date.now()
        });

        // Handle wicket
        if (wicket) {
            currentInnings.wickets += 1;
            const outBatsman = battingTeam.players.find(
                p => p.id === (outBatsmanId || currentInnings.currentStrikerId)
            );
            if (outBatsman) {
                outBatsman.isOut = true;
            }
        }

        // Check for innings completion after updating everything
        if (!currentInnings.isCompleted) {
            // Only run this if the innings hasn't already been marked as complete
            // to avoid overriding the match result
            checkInningsCompletionHelper(state);
        }
    },

    undoLastBall: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        const lastDelivery = currentInnings.deliveries[currentInnings.deliveries.length - 1];
        
        if (!lastDelivery) return;

        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];

        // Undo batsman stats
        const striker = battingTeam.players.find(p => p.id === lastDelivery.batsmanId);
        if (striker && (!lastDelivery.extraType || lastDelivery.extraType === 'no-ball')) {
            striker.runs -= lastDelivery.batsmanRuns;
            striker.balls -= 1;
            if (lastDelivery.runs === 4) striker.fours -= 1;
            if (lastDelivery.runs === 6) striker.sixes -= 1;
            striker.strikeRate = striker.balls > 0 ? (striker.runs / striker.balls) * 100 : 0;
        }

        // Undo bowler stats
        const bowler = bowlingTeam.players.find(p => p.id === lastDelivery.bowlerId);
        if (bowler) {
            bowler.runsConceded -= lastDelivery.runs;
            if (!lastDelivery.extraType || lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
                bowler.ballsThisOver -= 1;
                if (bowler.ballsThisOver < 0) {
                    bowler.overs -= 1;
                    bowler.ballsThisOver = 5;
                }
            }
            if (lastDelivery.wicket && !['runout', 'retired'].includes(lastDelivery.wicketType || '')) {
                bowler.wickets -= 1;
            }
        }

        // Undo innings stats
        currentInnings.totalRuns -= lastDelivery.runs;
        if (lastDelivery.extraType) {
            currentInnings.extras -= lastDelivery.extraType === 'wide' || lastDelivery.extraType === 'no-ball' ? 1 : 0;
        }
        if (!lastDelivery.extraType || lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
            currentInnings.ballInCurrentOver -= 1;
            if (currentInnings.ballInCurrentOver < 0) {
                currentInnings.completedOvers -= 1;
                currentInnings.ballInCurrentOver = 5;
            }
        }

        // Remove last delivery
        currentInnings.deliveries.pop();
    },

    addExtraRuns: (state: ScoreboardState, action: PayloadAction<number>) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        currentInnings.extras += action.payload;
        currentInnings.totalRuns += action.payload;
    },

    swapBatsmen: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        const temp = currentInnings.currentStrikerId;
        currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
        currentInnings.currentNonStrikerId = temp;
    },

    retireBatsman: (state: ScoreboardState, action: PayloadAction<string>) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        
        const batsman = battingTeam.players.find(p => p.id === action.payload);
        if (batsman) {
            batsman.isRetired = true;
            if (currentInnings.currentStrikerId === action.payload) {
                currentInnings.currentStrikerId = undefined;
            } else if (currentInnings.currentNonStrikerId === action.payload) {
                currentInnings.currentNonStrikerId = undefined;
            }
        }
    }
};