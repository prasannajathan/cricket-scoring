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

        // Update bowler stats - FIXED
        const bowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);
        if (bowler) {
            // For wides, count total runs (penalty + extras) against bowler
            if (extraType === 'wide') {
                bowler.runsConceded += totalRuns; // Include all runs from wide
                // Don't increment bowler's balls for wide balls (keep this behavior)
            }
            // Rest of your bowler stats code remains the same...
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
            // Match is won by the batting team
            currentInnings.isCompleted = true;
            state.matchOver = true;

            // Calculate the margin of victory (by wickets)
            const remainingWickets = calculateRemainingWickets(battingTeam, currentInnings.wickets, state);

            // Set the match result
            state.matchResult = `${battingTeam.teamName} wins by ${remainingWickets} wickets`;

            // Make sure to update the ball count for a legal delivery before ending
            if (legalDelivery) {
                // Increment ball count
                currentInnings.ballInCurrentOver += 1;

                // Check if over is complete
                if (currentInnings.ballInCurrentOver === 6) {
                    currentInnings.completedOvers += 1;
                    currentInnings.ballInCurrentOver = 0;

                    // No need to swap bowlers as match is over
                }
            }

            // Record the delivery
            currentInnings.deliveries.push({
                runs: extraType === 'wide' || extraType === 'no-ball' ? totalRuns - 1 : runs, // Store actual runs without penalty for display
                totalRuns: totalRuns, // Store full total including penalties
                batsmanRuns: extraType === 'bye' || extraType === 'leg-bye' || extraType === 'wide' ? 0 : runs,
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
            // For wides, the batsmen should switch when ADDITIONAL runs are odd
            // Not when total runs (including penalty) are odd
            // For no-balls, it's the actual runs that determine if batsmen switch
            // Penalty run doesn't count for switching
            if (runs % 2 === 1) {  // Just check the additional runs
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
            runs: extraType === 'wide' || extraType === 'no-ball' ? totalRuns - 1 : runs, // Store actual runs without penalty for display
            totalRuns: totalRuns, // Store full total including penalties
            batsmanRuns: extraType === 'bye' || extraType === 'leg-bye' || extraType === 'wide' ? 0 : runs,
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

        // Debug log after all updates
        console.log("SCORING COMPLETED:", {
            ballType: extraType || 'regular',
            baseRuns: runs,
            totalRuns: totalRuns,
            currentTotal: currentInnings.totalRuns,
            extras: currentInnings.extras,
            bowlerConceded: bowler?.runsConceded || 0,
            legalDelivery,
            ballsInOver: currentInnings.ballInCurrentOver,
            overs: `${currentInnings.completedOvers}.${currentInnings.ballInCurrentOver}`
        });

        // Check for innings completion after updating everything
        if (!currentInnings.isCompleted) {
            // Only run this if the innings hasn't already been marked as complete
            // to avoid overriding the match result
            checkInningsCompletionHelper(state);
        }
    },

    undoLastBall: (state: ScoreboardState) => {
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        // If no deliveries to undo, return early
        if (!currentInnings.deliveries.length) return;
        
        const lastDelivery = currentInnings.deliveries[currentInnings.deliveries.length - 1];
        
        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        
        // Store original state values to determine switching needs
        const wasLastBallOfOver = currentInnings.ballInCurrentOver === 0 && currentInnings.completedOvers > 0;
        const wasOddRuns = lastDelivery.runs % 2 === 1;
        const wasLegalDelivery = !lastDelivery.extraType || 
                                lastDelivery.extraType === 'bye' || 
                                lastDelivery.extraType === 'leg-bye';
        const wasMatchWinningDelivery = state.matchOver && 
                                       state.currentInning === 2 && 
                                       currentInnings.deliveries.length === 
                                       currentInnings.deliveries.indexOf(lastDelivery) + 1;
        
        // Calculate total runs that were scored on this delivery
        let totalRunsToUndo = lastDelivery.totalRuns || 0;
        
        // Undo batsman stats
        const striker = battingTeam.players.find(p => p.id === lastDelivery.batsmanId);
        if (striker) {
            // Only undo batsman's runs if it wasn't a bye/leg-bye or wide
            if (!lastDelivery.extraType || lastDelivery.extraType === 'no-ball') {
                striker.runs -= lastDelivery.batsmanRuns || 0;
                striker.balls -= 1;
                if (lastDelivery.runs === 4) striker.fours -= 1;
                if (lastDelivery.runs === 6) striker.sixes -= 1;
                striker.strikeRate = striker.balls > 0 ? (striker.runs / striker.balls) * 100 : 0;
            }
        }
        
        // Undo bowler stats
        const bowler = bowlingTeam.players.find(p => p.id === lastDelivery.bowlerId);
        if (bowler) {
            if (lastDelivery.extraType === 'wide' || lastDelivery.extraType === 'no-ball') {
                // For wides and no-balls, bowler concedes all runs including penalty
                bowler.runsConceded -= totalRunsToUndo;
            } else if (lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
                // Byes and leg byes aren't charged to the bowler, but count as legal deliveries
                bowler.ballsThisOver -= 1;
            } else {
                // Regular delivery
                bowler.runsConceded -= lastDelivery.runs;
                bowler.ballsThisOver -= 1;
            }
            
            // Fix over count if needed
            if (bowler.ballsThisOver < 0) {
                bowler.overs -= 1;
                bowler.ballsThisOver = 5; // Back to the last ball of previous over
            }
            
            // Undo wicket
            if (lastDelivery.wicket && !['runout', 'retired'].includes(lastDelivery.wicketType || '')) {
                bowler.wickets -= 1;
            }
            
            // Recalculate economy rate
            const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
            if (totalBalls > 0) {
                bowler.economy = (bowler.runsConceded / (totalBalls / 6));
            } else {
                bowler.economy = 0;
            }
        }
        
        // Undo innings stats
        currentInnings.totalRuns -= totalRunsToUndo;
        
        // Fix extras count
        if (lastDelivery.extraType) {
            if (lastDelivery.extraType === 'wide' || lastDelivery.extraType === 'no-ball') {
                currentInnings.extras -= totalRunsToUndo;
            } else {
                currentInnings.extras -= lastDelivery.runs;
            }
        }
        
        // Fix ball count
        if (wasLegalDelivery) {
            currentInnings.ballInCurrentOver -= 1;
            if (currentInnings.ballInCurrentOver < 0) {
                currentInnings.completedOvers -= 1;
                currentInnings.ballInCurrentOver = 5;
                
                // Reset lastOverBowlerId if we're undoing across overs
                if (wasLastBallOfOver) {
                    currentInnings.lastOverBowlerId = undefined;
                }
            }
        }
        
        // Undo wicket
        if (lastDelivery.wicket) {
            currentInnings.wickets -= 1;
            const outBatsman = battingTeam.players.find(p => p.id === lastDelivery.outBatsmanId);
            if (outBatsman) {
                outBatsman.isOut = false;
            }
        }
        
        // Handle batsmen switching
        // Case 1: End of over switch (legal delivery and last ball of over)
        if (wasLastBallOfOver && wasLegalDelivery) {
            // Swap batsmen back
            const temp = currentInnings.currentStrikerId;
            currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
            currentInnings.currentNonStrikerId = temp;
            
            // Update team state as well
            battingTeam.currentStrikerId = currentInnings.currentStrikerId;
            battingTeam.currentNonStrikerId = currentInnings.currentNonStrikerId;
        }
        // Case 2: Odd runs on legal delivery
        else if (wasLegalDelivery && wasOddRuns) {
            // Swap batsmen back
            const temp = currentInnings.currentStrikerId;
            currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
            currentInnings.currentNonStrikerId = temp;
            
            // Update team state as well
            battingTeam.currentStrikerId = currentInnings.currentStrikerId;
            battingTeam.currentNonStrikerId = currentInnings.currentNonStrikerId;
        }
        // Case 3: Odd runs on wide/no-ball
        else if ((lastDelivery.extraType === 'wide' || lastDelivery.extraType === 'no-ball') && wasOddRuns) {
            // Swap batsmen back
            const temp = currentInnings.currentStrikerId;
            currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
            currentInnings.currentNonStrikerId = temp;
            
            // Update team state as well
            battingTeam.currentStrikerId = currentInnings.currentStrikerId;
            battingTeam.currentNonStrikerId = currentInnings.currentNonStrikerId;
        }
        
        // Reset match status if undoing match-winning delivery
        if (wasMatchWinningDelivery) {
            state.matchOver = false;
            state.matchResult = undefined;
            currentInnings.isCompleted = false;
            state.alertMessage = undefined;
        }
        
        // Reset innings completion status if appropriate
        if (currentInnings.isCompleted) {
            // Only reset if this undo would make the innings incomplete
            if (
                // For first innings: if now below total overs
                (state.currentInning === 1 && currentInnings.completedOvers < state.totalOvers) ||
                // For second innings: if now below target and still have wickets
                (state.currentInning === 2 && 
                 state.targetScore && 
                 currentInnings.totalRuns < state.targetScore &&
                 currentInnings.wickets < battingTeam.players.length - 1)
            ) {
                currentInnings.isCompleted = false;
            }
        }
        
        // Remove last delivery
        currentInnings.deliveries.pop();
        
        // Log debug info after undo
        console.log("After undo:", {
            totalRuns: currentInnings.totalRuns,
            extras: currentInnings.extras,
            completedOvers: currentInnings.completedOvers,
            ballInCurrentOver: currentInnings.ballInCurrentOver,
            wasLastBallOfOver,
            wasOddRuns,
            wasLegalDelivery,
            wasMatchWinningDelivery,
            currentStriker: battingTeam.players.find(p => p.id === currentInnings.currentStrikerId)?.name,
            currentNonStriker: battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId)?.name
        });
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