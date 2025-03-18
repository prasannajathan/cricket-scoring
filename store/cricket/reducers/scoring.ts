import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState, ScoreBallPayload } from '@/types';
import { checkInningsCompletionHelper, calculateRemainingWickets } from '@/utils';

// Add this helper function to your scoreboardSlice.ts
const updateBatsmenPositions = (state: ScoreboardState, strikerId: string | undefined, nonStrikerId: string | undefined) => {
    const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
    
    // Update innings state
    currentInnings.currentStrikerId = strikerId;
    currentInnings.currentNonStrikerId = nonStrikerId;
    
    // Update team state
    const battingTeamKey = currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB';
    state[battingTeamKey].currentStrikerId = strikerId;
    state[battingTeamKey].currentNonStrikerId = nonStrikerId;
    
    console.log("Batsmen positions updated:", {
        striker: strikerId,
        nonStriker: nonStrikerId
    });
};

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

        // Add this near the beginning of your scoreBall function
        if (currentInnings.ballInCurrentOver >= 6) {
            console.warn("WARNING: Ball count is already at or over 6, this shouldn't happen!");
            currentInnings.ballInCurrentOver = 5; // Cap it at 5 to make sure next ball completes the over
        }

        // Update batsman stats - CORRECTED
        const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
        if (striker) {
            // Only count runs for batsman on regular deliveries or no-balls (not byes/leg-byes/wides)
            if (!extraType || extraType === 'no-ball') {
                striker.runs += runs;
                if (runs === 4) striker.fours += 1;
                if (runs === 6) striker.sixes += 1;
            }
            
            // Count the ball for the batsman for all legal deliveries
            // Legal deliveries are regular, bye, leg-bye (not wide or no-ball)
            if (!extraType || extraType === 'bye' || extraType === 'leg-bye') {
                striker.balls += 1;
            }
            
            // Update strike rate
            if (striker.balls > 0) {
                striker.strikeRate = (striker.runs / striker.balls) * 100;
            }
        }

        // Handle extras
        if (extraType === 'wide' || extraType === 'no-ball') {
            totalRuns += 1; // Add penalty run
            currentInnings.extras += 1; // Count penalty run as extra
            
            // For wide and no-ball, the additional runs (beyond the penalty) are also extras
            if (runs > 0) {
                currentInnings.extras += runs;
            }
            
            legalDelivery = false;
        } else if (extraType === 'bye' || extraType === 'leg-bye') {
            currentInnings.extras += runs; // All bye/leg-bye runs count as extras
        }

        // Update bowler stats - CORRECTED
        const bowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);
        if (bowler) {
            if (extraType === 'wide') {
                // CORRECTED: Wides don't count against bowler's personal runs conceded stat
                // Don't increment bowler.runsConceded
                // Don't increment bowler's balls for wide balls (already correct)
            }
            else if (extraType === 'no-ball') {
                // No-ball penalty counts against bowler
                bowler.runsConceded += 1;
                
                // If there are batsman runs on a no-ball, add them to the bowler too
                if (runs > 0) {
                    bowler.runsConceded += runs;
                }
                
                // No-balls don't count as balls bowled
            }
            else if (extraType === 'bye' || extraType === 'leg-bye') {
                // Count the ball but not the runs
                bowler.ballsThisOver += 1;
                // Don't add runs to bowler's runsConceded for byes/leg-byes
            }
            else {
                // Regular delivery - add runs and count the ball
                bowler.runsConceded += runs;
                bowler.ballsThisOver += 1;
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
            if (currentInnings.ballInCurrentOver === 6) {
                currentInnings.completedOvers += 1;
                currentInnings.ballInCurrentOver = 0;
                currentInnings.lastOverBowlerId = currentInnings.currentBowlerId;

                console.log("END OF OVER - Before swap:", {
                    striker: battingTeam.players.find(p => p.id === currentInnings.currentStrikerId)?.name,
                    nonStriker: battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId)?.name,
                    strikerID: currentInnings.currentStrikerId,
                    nonStrikerID: currentInnings.currentNonStrikerId
                });

                // Always swap batsmen at end of over
                updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);

                console.log("END OF OVER - After swap:", {
                    striker: battingTeam.players.find(p => p.id === currentInnings.currentStrikerId)?.name,
                    nonStriker: battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId)?.name,
                    strikerID: currentInnings.currentStrikerId,
                    nonStrikerID: currentInnings.currentNonStrikerId,
                    teamStriker: battingTeam.currentStrikerId,
                    teamNonStriker: battingTeam.currentNonStrikerId
                });

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
                updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
            }
        } else if (extraType === 'wide' || extraType === 'no-ball') {
            // For wides, the batsmen should switch when ADDITIONAL runs are odd
            // Not when total runs (including penalty) are odd
            // For no-balls, it's the actual runs that determine if batsmen switch
            // Penalty run doesn't count for switching
            if (runs % 2 === 1) {  // Just check the additional runs
                updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
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
            if (lastDelivery.extraType === 'wide') {
                // FIXED: For wides, don't deduct runs from bowler's personal stats
                // since we don't add them in scoring
            } else if (lastDelivery.extraType === 'no-ball') {
                // For no-balls, undo all runs including penalty
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
        
        // Fix extras count - CORRECTED
        if (lastDelivery.extraType) {
            if (lastDelivery.extraType === 'wide' || lastDelivery.extraType === 'no-ball') {
                // For wides and no-balls, subtract all runs as extras
                currentInnings.extras -= totalRunsToUndo;
            } else if (lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
                // For byes and leg-byes, just subtract the runs
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
            console.log("Undoing end of over - swapping batsmen back");
            
            // Swap batsmen back
            updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
            
            // Reset lastOverBowlerId since we're going back to the previous over
            currentInnings.lastOverBowlerId = undefined;
        }
        // Case 2: Odd runs on legal delivery
        else if (wasLegalDelivery && wasOddRuns) {
            // Swap batsmen back
            updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
        }
        // Case 3: Odd runs on wide/no-ball
        else if ((lastDelivery.extraType === 'wide' || lastDelivery.extraType === 'no-ball') && wasOddRuns) {
            // Swap batsmen back
            updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
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
        // Get the current innings
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        
        // Swap batsmen in the innings
        updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
        
        console.log("Manually swapped batsmen:", {
            striker: currentInnings.currentStrikerId,
            nonStriker: currentInnings.currentNonStrikerId
        });
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