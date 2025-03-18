import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState, ScoreBallPayload, Team, InningsData } from '@/types';
import { checkInningsCompletionHelper, calculateRemainingWickets, updateBatsmenPositions } from '@/utils';

export const scoringReducers = {
    scoreBall: (state: ScoreboardState, action: PayloadAction<ScoreBallPayload>) => {
        // If match is already over, don't allow more scoring
        if (state.matchOver) return;

        // Get current innings and teams
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];

        const { runs, extraType, wicket, outBatsmanId, wicketType } = action.payload;
        let totalRuns = runs;
        let legalDelivery = true;

        // Safety check for ball count
        if (currentInnings.ballInCurrentOver >= 6) {
            console.warn("WARNING: Ball count is already at or over 6, this shouldn't happen!");
            currentInnings.ballInCurrentOver = 5;
        }

        // Update batsman stats
        const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
        if (striker) {
            // Only count runs for batsman on regular deliveries or no-balls (not byes/leg-byes/wides)
            if (!extraType || extraType === 'no-ball') {
                striker.runs += runs;
                if (runs === 4) striker.fours += 1;
                if (runs === 6) striker.sixes += 1;
            }
            
            // Count the ball for the batsman for all legal deliveries
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
            
            if (runs > 0) {
                currentInnings.extras += runs;
            }
            
            legalDelivery = false;
        } else if (extraType === 'bye' || extraType === 'leg-bye') {
            currentInnings.extras += runs;
        }

        // Update bowler stats
        const bowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);
        if (bowler) {
            // We don't charge wides to the bowler's personal stats
            if (extraType === 'no-ball') {
                bowler.runsConceded += 1; // No-ball penalty
                if (runs > 0) {
                    bowler.runsConceded += runs;
                }
            } 
            else if (extraType === 'bye' || extraType === 'leg-bye') {
                bowler.ballsThisOver += 1;
            }
            else if (!extraType) {
                // Regular delivery
                bowler.runsConceded += runs;
                bowler.ballsThisOver += 1;
            }

            // Update economy rate
            const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
            if (totalBalls > 0) {
                bowler.economy = (bowler.runsConceded / (totalBalls / 6));
            }

            // Handle wicket
            if (wicket && !['runout', 'retired'].includes(wicketType || '')) {
                bowler.wickets += 1;
            }
        }

        // Update innings total
        currentInnings.totalRuns += totalRuns;

        // Check for target reached
        if (state.currentInning === 2 && state.targetScore && currentInnings.totalRuns >= state.targetScore) {
            // Handle match victory logic
            handleMatchVictory(state, currentInnings, battingTeam, legalDelivery);
            
            // Record the delivery
            recordDelivery(currentInnings, extraType, totalRuns, runs, wicket, outBatsmanId, wicketType);
            
            return; // Exit early - match is over
        }

        // Handle ball count and over completion
        if (legalDelivery) {
            currentInnings.ballInCurrentOver += 1;

            const isLastBallOfOver = currentInnings.ballInCurrentOver === 6;
            const isOddRun = runs % 2 === 1;
            
            if (isLastBallOfOver) {
                // End of over logic
                currentInnings.completedOvers += 1;
                currentInnings.ballInCurrentOver = 0;
                currentInnings.lastOverBowlerId = currentInnings.currentBowlerId;
                
                // CRITICAL FIX: For end of over batsman switching
                // If the last ball had odd runs, batsmen already switched, so don't switch again
                // If the last ball had even runs, need to switch batsmen
                if (!isOddRun) {
                    updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
                }
                
                // Update bowler stats
                if (bowler) {
                    bowler.overs += 1;
                    bowler.ballsThisOver = 0;
                }
                
                // Check for innings completion
                if (state.currentInning === 1 && currentInnings.completedOvers >= state.totalOvers) {
                    currentInnings.isCompleted = true;
                }
            } 
            else if (isOddRun) {
                // Not end of over, but odd runs, so switch batsmen
                updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
            }
        } 
        else if ((extraType === 'wide' || extraType === 'no-ball') && runs % 2 === 1) {
            // For extras with odd additional runs, switch batsmen
            updateBatsmenPositions(state, currentInnings.currentNonStrikerId, currentInnings.currentStrikerId);
        }

        // Record the delivery
        recordDelivery(currentInnings, extraType, totalRuns, runs, wicket, outBatsmanId, wicketType);

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

        // Check for innings completion if not already marked
        if (!currentInnings.isCompleted) {
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
        if (wasLastBallOfOver && wasLegalDelivery) {
            console.log("Undoing end of over switching");
            
            // When undoing the last ball of an over, we need to consider if it was an odd run
            // If it was odd, the batsmen were already switched once for the odd run, and then stayed that way for the end of over
            // If it was even, the batsmen were switched once for the end of over
            
            const wasOddRunOnLastBall = lastDelivery.runs % 2 === 1;
            if (!wasOddRunOnLastBall) {
                // If it was an even-run ball at the end of an over, we need to switch back
                updateBatsmenPositions(
                    state, 
                    currentInnings.currentNonStrikerId, 
                    currentInnings.currentStrikerId
                );
            }
            
            // Reset lastOverBowlerId
            currentInnings.lastOverBowlerId = undefined;
        }
        // Case 2: Odd runs on any ball (including last ball of over)
        else if (wasOddRuns) {
            // Always switch back for any odd run
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

// Helper functions
function handleMatchVictory(state: ScoreboardState, currentInnings: InningsData, battingTeam: Team, legalDelivery: boolean) {
    currentInnings.isCompleted = true;
    state.matchOver = true;

    // Calculate remaining wickets
    const remainingWickets = calculateRemainingWickets(battingTeam, currentInnings.wickets, state);

    // Set match result
    state.matchResult = `${battingTeam.teamName} wins by ${remainingWickets} wickets`;
    state.alertMessage = `${battingTeam.teamName} has won the match by ${remainingWickets} wickets!`;

    // Update ball count for a legal delivery
    if (legalDelivery) {
        currentInnings.ballInCurrentOver += 1;
        if (currentInnings.ballInCurrentOver === 6) {
            currentInnings.completedOvers += 1;
            currentInnings.ballInCurrentOver = 0;
        }
    }
}

function recordDelivery(currentInnings: InningsData, extraType: any, totalRuns: number, runs: number, wicket: boolean, outBatsmanId: string, wicketType:any) {
    currentInnings.deliveries.push({
        runs: extraType === 'wide' || extraType === 'no-ball' ? totalRuns - 1 : runs,
        totalRuns: totalRuns,
        batsmanRuns: extraType === 'bye' || extraType === 'leg-bye' || extraType === 'wide' ? 0 : runs,
        extraType,
        wicket: wicket || false,
        outBatsmanId,
        wicketType,
        bowlerId: currentInnings.currentBowlerId!,
        batsmanId: currentInnings.currentStrikerId!,
        timestamp: Date.now()
    });
}