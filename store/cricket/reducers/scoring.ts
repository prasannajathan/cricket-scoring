import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState, ScoreBallPayload, Team, InningsData } from '@/types';
import { checkInningsCompletionHelper, calculateMatchResult, updateBatsmenPositions } from '@/utils';

export const scoringReducers = {
    scoreBall: (state: ScoreboardState, action: PayloadAction<ScoreBallPayload>) => {
        // If match is already over, don't allow more scoring
        if (state.matchOver) return;

        // Get current innings and teams
        const currentInnings = state.currentInning === 1 ? state.innings1 : state.innings2;
        const battingTeam = state[
            currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'
        ];
        const bowlingTeam = state[
            currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'
        ];

        const { runs, extraType, wicket, outBatsmanId, wicketType, nextBatsmanId, fielderId } = action.payload;
        const preSwitchStrikerId = currentInnings.currentStrikerId;

        let totalRuns = runs;
        let isLegalDelivery = true;

        // Safety check for ball count
        if (currentInnings.ballInCurrentOver >= 6) {
            console.warn("WARNING: Ball count is already at or over 6, this shouldn't happen!");
            currentInnings.ballInCurrentOver = 5;
        }

        // Apply extras (updates totalRuns and extras)
        totalRuns = applyExtras(currentInnings, extraType, runs);

        // Determine if it's a legal delivery
        if (extraType === 'wide' || extraType === 'no-ball') {
            isLegalDelivery = false;
        }

        // Update batsman stats
        updateBatsmanStats(battingTeam, currentInnings, runs, extraType);
        // Update bowler stats
        updateBowlerStats(bowlingTeam, currentInnings, runs, extraType, wicket, wicketType, fielderId);
        // Update partnership stats
        updatePartnershipStats(currentInnings, totalRuns, isLegalDelivery);

        // Update innings total
        currentInnings.totalRuns += totalRuns;

        // If in second innings and target is set, check if target is reached
        if (
            state.currentInning === 2 &&
            state.targetScore &&
            currentInnings.totalRuns >= state.targetScore
        ) {
            // Handle match victory logic
            handleMatchVictory(state, currentInnings, battingTeam, isLegalDelivery);

            // Record the delivery
            recordDelivery(currentInnings, extraType, totalRuns, runs, wicket, outBatsmanId, wicketType, preSwitchStrikerId, nextBatsmanId, fielderId);

            return; // Match is over
        }

        // Handle ball count and overs if legal delivery
        handleBallAndOverCount(state, currentInnings, bowlingTeam, runs, isLegalDelivery, extraType);

        // Record the delivery
        recordDelivery(currentInnings, extraType, totalRuns, runs, wicket, outBatsmanId, wicketType, preSwitchStrikerId, nextBatsmanId, fielderId);

        // Handle wicket
        if (wicket) {
            currentInnings.wickets += 1;

            // Check if team is all out after this wicket
            const maxWickets = state.totalPlayers - 1; // Typically 10 in standard cricket
            const isAllOut = currentInnings.wickets >= maxWickets;

            // Handle partnerships
            if (currentInnings.currentPartnership) {
                // Store the completed partnership
                if (!currentInnings.partnerships) {
                    currentInnings.partnerships = [];
                }

                currentInnings.partnerships.push({
                    ...currentInnings.currentPartnership,
                    isActive: false
                });

                // Only create a new partnership if not all out and nextBatsmanId is provided
                if (!isAllOut && nextBatsmanId) {
                    currentInnings.currentPartnership = {
                        player1Id: outBatsmanId === currentInnings.currentStrikerId
                            ? (nextBatsmanId || '')
                            : (currentInnings.currentStrikerId || ''),
                        player2Id: outBatsmanId === currentInnings.currentNonStrikerId
                            ? (nextBatsmanId || '')
                            : (currentInnings.currentNonStrikerId || ''),
                        runs: 0,
                        balls: 0,
                        isActive: true,
                        startTime: Date.now()
                    };
                }
            }

            // 1) Mark old batter as out
            const outBatsman = battingTeam.players.find(
                p => p.id === (outBatsmanId || preSwitchStrikerId)
            );
            if (outBatsman) {
                outBatsman.isOut = true;
            }

            // 2) Insert the new batter in place of the out batsman (only if not all out)
            if (nextBatsmanId && !isAllOut) {
                if (outBatsman?.id === currentInnings.currentStrikerId) {
                    currentInnings.currentStrikerId = nextBatsmanId;
                } else if (outBatsman?.id === currentInnings.currentNonStrikerId) {
                    currentInnings.currentNonStrikerId = nextBatsmanId;
                }
            }

            // 3) Handle all-out case specially
            if (isAllOut) {
                currentInnings.isAllOut = true;

                // For all-out in first innings, mark ready for innings 2
                if (state.currentInning === 1) {
                    currentInnings.readyForInnings2 = true;
                } else {
                    // For all-out in second innings, match is over
                    state.matchOver = true;

                    // Use centralized function to calculate result
                    calculateMatchResult(state);
                }
            } else {
                // Only do the strike rotation for non-all-out cases
                // const isLastBallOfOver = currentInnings.ballInCurrentOver === 5 ||
                //     (isLegalDelivery && currentInnings.ballInCurrentOver + 1 === 6);
                const isLastBallOfOver = currentInnings.ballInCurrentOver === 6;
                const isOddRun = runs % 2 === 1;

                if (isLastBallOfOver && !isOddRun) {
                    updateBatsmenPositions(
                        state,
                        currentInnings.currentNonStrikerId,
                        currentInnings.currentStrikerId
                    );
                }
            }
        }

        // Check for innings completion if not already marked
        if (!currentInnings.isCompleted) {
            checkInningsCompletionHelper(state);
        }
    },

    undoLastBall: (state: ScoreboardState) => {
        const currentInnings =
            state.currentInning === 1 ? state.innings1 : state.innings2;

        // If no deliveries to undo, return early
        if (!currentInnings.deliveries.length) return;

        const lastDelivery =
            currentInnings.deliveries[currentInnings.deliveries.length - 1];

        const battingTeam = state[currentInnings.battingTeamId === state.teamA.id ? 'teamA' : 'teamB'];
        const bowlingTeam = state[currentInnings.bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB'];

        // Determine the context of the last delivery
        const wasLastBallOfOver =
            currentInnings.ballInCurrentOver === 0 && currentInnings.completedOvers > 0;
        const wasOddRuns = lastDelivery.runs % 2 === 1;
        const wasLegalDelivery =
            !lastDelivery.extraType ||
            lastDelivery.extraType === 'bye' ||
            lastDelivery.extraType === 'leg-bye';
        const wasMatchWinningDelivery =
            state.matchOver &&
            state.currentInning === 2 &&
            currentInnings.deliveries.length ===
            currentInnings.deliveries.indexOf(lastDelivery) + 1;

        // 1) Revert batsman stats
        revertBatsmanStats(battingTeam, lastDelivery);

        // 2) Revert bowler stats
        revertBowlerStats(bowlingTeam, currentInnings, lastDelivery);
        
        // 2.5) Revert fielder stats if applicable
        revertFielderStats(bowlingTeam, lastDelivery);

        // 3) Revert innings total & extras
        revertInningsStats(currentInnings, lastDelivery);

        // 4) Revert ball count and overs
        revertBallCountAndOvers(
            currentInnings,
            wasLegalDelivery,
            wasLastBallOfOver,
            lastDelivery
        );

        // 5) Revert wicket
        revertWicket(currentInnings, battingTeam, lastDelivery);

        // 6) Revert bowler change if applicable
        revertBowlerChange(currentInnings, bowlingTeam, lastDelivery);

        // 7) Revert batsmen switching
        revertBatsmenSwitchingIfNeeded(
            state,
            currentInnings,
            wasLastBallOfOver,
            wasOddRuns,
            wasLegalDelivery,
            lastDelivery
        );

        // 8) Revert match status if it was match-winning
        if (wasMatchWinningDelivery) {
            revertMatchStatusIfNeeded(state, currentInnings);
        }

        // 9) Possibly revert innings completion
        revertInningsCompletionIfNeeded(state, currentInnings, battingTeam);

        // 10) revert partnership stats
        revertPartnershipStats(currentInnings, lastDelivery);

        // Finally, remove the last delivery
        currentInnings.deliveries.pop();

        // Log debug info after undo
        console.log('After undo:', {
            totalRuns: currentInnings.totalRuns,
            extras: currentInnings.extras,
            completedOvers: currentInnings.completedOvers,
            ballInCurrentOver: currentInnings.ballInCurrentOver,
            wasLastBallOfOver,
            wasOddRuns,
            wasLegalDelivery,
            wasMatchWinningDelivery,
            currentStriker: battingTeam.players.find(
                p => p.id === currentInnings.currentStrikerId
            )?.name,
            currentNonStriker: battingTeam.players.find(
                p => p.id === currentInnings.currentNonStrikerId
            )?.name,
            currentBowler: bowlingTeam.players.find(
                p => p.id === currentInnings.currentBowlerId
            )?.name
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

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function applyExtras(
    currentInnings: InningsData,
    extraType: string | undefined,
    runs: number
): number {
    let totalRuns = runs;

    if (extraType === 'wide' || extraType === 'no-ball') {
        // Add penalty run
        totalRuns += 1;
        currentInnings.extras += 1;

        // If there are additional runs off the bat (no-ball case)
        if (runs > 0) {
            currentInnings.extras += runs;
        }
    } else if (extraType === 'bye' || extraType === 'leg-bye') {
        currentInnings.extras += runs;
    }

    return totalRuns;
}

function updateBatsmanStats(
    battingTeam: Team,
    currentInnings: InningsData,
    runs: number,
    extraType: string | undefined
) {
    const striker = battingTeam.players.find(
        p => p.id === currentInnings.currentStrikerId
    );
    if (!striker) return;

    // Only count runs for batsman on regular deliveries or no-balls (not byes/leg-byes/wides)
    if (!extraType || extraType === 'no-ball') {
        striker.runs += runs;
        if (runs === 4) striker.fours += 1;
        if (runs === 6) striker.sixes += 1;
    }

    // Count the ball if it's a legal delivery or a bye/leg-bye
    if (!extraType || extraType === 'bye' || extraType === 'leg-bye') {
        striker.balls += 1;
    }

    // Update strike rate
    if (striker.balls > 0) {
        striker.strikeRate = (striker.runs / striker.balls) * 100;
    }
}

function updateBowlerStats(
    bowlingTeam: Team,
    currentInnings: InningsData,
    runs: number,
    extraType: string | undefined,
    wicket: boolean | undefined,
    wicketType: string | undefined,
    fielderId?: string | undefined
) {
    const bowler = bowlingTeam.players.find(
        p => p.id === currentInnings.currentBowlerId
    );
    
    if (!bowler) return;

    // Handle different types of deliveries according to standard cricket rules
    if (extraType === 'wide') {
        // For wides: penalty run (1) + any additional runs are charged to the bowler
        bowler.runsConceded += 1 + runs; // Wide penalty (1) + any additional runs
        // No increment to ballsThisOver as wides aren't legal deliveries
    } else if (extraType === 'no-ball') {
        // For no-balls: penalty run (1) + any runs off the bat are charged to the bowler
        bowler.runsConceded += 1 + runs; // No-ball penalty (1) + any runs off the bat
        // No increment to ballsThisOver as no-balls aren't legal deliveries
    } else if (extraType === 'bye' || extraType === 'leg-bye') {
        // For byes/leg-byes: runs are NOT charged to the bowler, but count as legal deliveries
        bowler.ballsThisOver += 1;
        // No runs added to runsConceded
    } else if (!extraType) {
        // Regular delivery: runs are charged to bowler and counts as legal delivery
        bowler.runsConceded += runs;
        bowler.ballsThisOver += 1;
    }

    // Update economy
    const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
    if (totalBalls > 0) {
        bowler.economy = +(bowler.runsConceded / (totalBalls / 6)).toFixed(2);
    }

    // If it's a wicket of type other than runout/retired, increment bowler's wickets
    if (wicket && !['runout', 'retired'].includes(wicketType || '')) {
        bowler.wickets += 1;
    }

    // update fielder stats if applicable
    if (wicket && fielderId) {
        updateFielderStats(bowlingTeam, wicketType, fielderId);
    }
}

function updateFielderStats (
    bowlingTeam: Team,
    wicketType: string | undefined,
    fielderId: string
){
    const fielder = bowlingTeam.players.find(
        p => p.id === fielderId
    );
    if (!fielder) return;

    const isFielder = wicketType === 'caught' || wicketType === 'run out' || wicketType === 'stumped'
    if (fielder && isFielder) {
        if (wicketType === 'caught') {
            fielder.catches += 1;
        } else if (wicketType === 'run out') {
            fielder.runouts += 1;
        } else if (wicketType === 'stumped') {
            fielder.stumps += 1;
        }
    }
}

function updatePartnershipStats(
    currentInnings: InningsData,
    runs: number,
    isLegalDelivery: boolean
) {
    // Initialize partnership if it doesn't exist
    if (!currentInnings.currentPartnership) {
        currentInnings.currentPartnership = {
            player1Id: currentInnings.currentStrikerId || '',
            player2Id: currentInnings.currentNonStrikerId || '',
            runs: 0,
            balls: 0,
            startTime: Date.now()
        };
    }

    // Update partnership stats
    currentInnings.currentPartnership.runs += runs;
    if (isLegalDelivery) {
        currentInnings.currentPartnership.balls += 1;
    }
}

function handleBallAndOverCount(
    state: ScoreboardState,
    currentInnings: InningsData,
    bowlingTeam: Team,
    runs: number,
    isLegalDelivery: boolean,
    extraType: string | undefined
) {
    // If it's not a legal delivery, only switch strike for odd runs from wide/no-ball
    if (!isLegalDelivery) {
        // For wides and no-balls, switch strike if:
        // 1. The runs are odd, OR
        // 2. It's the last ball of an over (even for 0 runs)
        if ((extraType === 'wide' || extraType === 'no-ball') && runs % 2 === 1) {
            // const isLastBallOfOver = currentInnings.ballInCurrentOver === 6; // Checking current ball before increment
            // if ( isLastBallOfOver) {
            updateBatsmenPositions(
                state,
                currentInnings.currentNonStrikerId,
                currentInnings.currentStrikerId
            );
            // }
        }
        return;
    }

    currentInnings.ballInCurrentOver += 1;

    const bowler = bowlingTeam.players.find(
        p => p.id === currentInnings.currentBowlerId
    );
    const isLastBallOfOver = currentInnings.ballInCurrentOver === 6;
    const isOddRun = runs % 2 === 1;

    if (isLastBallOfOver) {
        // End of over
        currentInnings.completedOvers += 1;
        currentInnings.ballInCurrentOver = 0;
        currentInnings.lastOverBowlerId = currentInnings.currentBowlerId;

        // Switch strike if runs were even
        if (!isOddRun) {
            updateBatsmenPositions(
                state,
                currentInnings.currentNonStrikerId,
                currentInnings.currentStrikerId
            );
        }

        const currentOverDeliveries = currentInnings.deliveries.slice(-6);
        const isMaiden = currentOverDeliveries.every(d =>
            d.batsmanRuns === 0 // Only care about runs from the bat
        );

        if (isMaiden && bowler) {
            bowler.maidens += 1;
        }

        if (bowler) {
            bowler.overs += 1;
            bowler.ballsThisOver = 0;
        }

        // For first innings, check if overs are done
        if (state.currentInning === 1 && currentInnings.completedOvers >= state.totalOvers) {
            currentInnings.isCompleted = true;
        }
    } else {
        // Not last ball
        if (isOddRun) {
            // Switch batsmen for odd runs
            updateBatsmenPositions(
                state,
                currentInnings.currentNonStrikerId,
                currentInnings.currentStrikerId
            );
        }
    }
}

// This function remains unchanged from your original code
function handleMatchVictory(
    state: ScoreboardState,
    currentInnings: InningsData,
    battingTeam: Team,
    legalDelivery: boolean
) {
    // Mark innings and match as complete
    currentInnings.isCompleted = true;
    state.matchOver = true;

    // Use the centralized function for calculating match result
    calculateMatchResult(state);

    // Update ball count for a legal delivery
    if (legalDelivery) {
        currentInnings.ballInCurrentOver += 1;
        if (currentInnings.ballInCurrentOver === 6) {
            currentInnings.completedOvers += 1;
            currentInnings.ballInCurrentOver = 0;
        }
    }
}

// This function also remains unchanged
function recordDelivery(
    currentInnings: InningsData,
    extraType: any,
    totalRuns: number,
    runs: number,
    wicket: boolean | undefined,
    outBatsmanId: string | undefined,
    wicketType: any,
    preSwitchStrikerId: string | undefined,
    nextBatsmanId?: string,
    fielderId?: string
) {
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
        preSwitchStrikerId,
        nextBatsmanId,
        fielderId,
        overNumber: currentInnings.completedOvers + (currentInnings.ballInCurrentOver > 0 ? 1 : 0),
        ballInOver: currentInnings.ballInCurrentOver,
        timestamp: Date.now()
    });
}

// -----------------------------------------------------------------------------
// Undo Helpers
// -----------------------------------------------------------------------------

function revertBatsmanStats(battingTeam: Team, lastDelivery: any) {
    const striker = battingTeam.players.find(
        p => p.id === lastDelivery.batsmanId
    );
    if (!striker) return;

    // Revert runs and extras based on delivery type
    if (!lastDelivery.extraType || lastDelivery.extraType === 'no-ball') {
        // Regular delivery or no-ball: revert runs from batsman's score
        striker.runs -= lastDelivery.batsmanRuns || 0;
        
        // Revert boundaries
        if (lastDelivery.batsmanRuns === 4) striker.fours -= 1;
        if (lastDelivery.batsmanRuns === 6) striker.sixes -= 1;
    }
    
    // Count the ball faced if it was a legal delivery or bye/leg-bye
    if (!lastDelivery.extraType || lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
        striker.balls -= 1;
    }
    
    // Recalculate strike rate
    striker.strikeRate = striker.balls > 0 ? +(striker.runs / striker.balls * 100).toFixed(2) : 0;
}

function revertBowlerStats(
    bowlingTeam: Team,
    currentInnings: InningsData,
    lastDelivery: any
) {
    const bowler = bowlingTeam.players.find(
        p => p.id === lastDelivery.bowlerId
    );
    if (!bowler) return;

    // Handle different delivery types
    if (lastDelivery.extraType === 'wide') {
        // For wides: revert penalty run + any additional runs
        bowler.runsConceded -= (1 + (lastDelivery.runs || 0));
        // No change to ballsThisOver as wides don't count as legal deliveries
    } else if (lastDelivery.extraType === 'no-ball') {
        // For no-balls: revert penalty run + any runs off the bat
        bowler.runsConceded -= (1 + (lastDelivery.batsmanRuns || 0));
        // No change to ballsThisOver as no-balls don't count as legal deliveries
    } else if (lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
        // For byes/leg-byes: only revert the ball count, not the runs
        bowler.ballsThisOver -= 1;
        // No change to runsConceded
    } else {
        // Regular ball: revert both runs and ball count
        bowler.runsConceded -= (lastDelivery.batsmanRuns || 0);
        bowler.ballsThisOver -= 1;
    }

    // If we undid a wicket credited to the bowler (except runout/retired)
    if (
        lastDelivery.wicket &&
        !['runout', 'retired'].includes(lastDelivery.wicketType || '')
    ) {
        bowler.wickets -= 1;
    }

    // Fix over count if needed
    if (bowler.ballsThisOver < 0) {
        bowler.overs -= 1;
        bowler.ballsThisOver = 5; // Back to last ball of the previous over
        
        // Check if we're undoing the last ball of a maiden over
        // We need to check the 6 deliveries before this one to see if it was a maiden
        if (currentInnings.deliveries.length >= 6) {
            const overDeliveries = currentInnings.deliveries.slice(-6);
            const wasMaiden = overDeliveries.every(d => 
                (d.batsmanRuns || 0) === 0 // Check if there were any runs from the bat
            );
            
            // If it was a maiden, decrement the maiden count
            if (wasMaiden) {
                bowler.maidens = Math.max(0, (bowler.maidens || 0) - 1);
            }
        }
    }

    // Recalculate economy
    const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
    bowler.economy = totalBalls > 0 ? +(bowler.runsConceded / (totalBalls / 6)).toFixed(2) : 0;
}

function revertInningsStats(currentInnings: InningsData, lastDelivery: any) {
    const totalRunsToUndo = lastDelivery.totalRuns || 0;

    // Undo total runs
    currentInnings.totalRuns -= totalRunsToUndo;

    // Undo extras if applicable
    if (lastDelivery.extraType) {
        if (lastDelivery.extraType === 'wide') {
            // Wide: revert penalty run (1) + any additional runs
            currentInnings.extras -= (1 + (lastDelivery.runs || 0));
        } else if (lastDelivery.extraType === 'no-ball') {
            // No-ball: revert penalty run (1)
            currentInnings.extras -= 1;
        } else if (
            lastDelivery.extraType === 'bye' ||
            lastDelivery.extraType === 'leg-bye'
        ) {
            // Bye/leg-bye: revert all runs as extras
            currentInnings.extras -= lastDelivery.runs || 0;
        }
    }
}

function revertBallCountAndOvers(
    currentInnings: InningsData,
    wasLegalDelivery: boolean,
    wasLastBallOfOver: boolean,
    lastDelivery: any
) {
    if (wasLegalDelivery) {
        currentInnings.ballInCurrentOver -= 1;

        if (currentInnings.ballInCurrentOver < 0) {
            // We must have undone the last ball of the previous over
            currentInnings.completedOvers -= 1;
            currentInnings.ballInCurrentOver = 5;

            // Reset lastOverBowlerId if we are undoing across an over boundary
            if (wasLastBallOfOver) {
                currentInnings.lastOverBowlerId = undefined;
            }
        }
    }
}

function revertWicket(
    currentInnings: InningsData,
    battingTeam: Team,
    lastDelivery: any
) {
    if (lastDelivery.wicket) {
        // Decrement the wicket count
        currentInnings.wickets = Math.max(0, currentInnings.wickets - 1);
        
        // Determine which batsman was out
        const outBatsman = battingTeam.players.find(
            p => p.id === lastDelivery.outBatsmanId
        );
        
        if (outBatsman) {
            // Restore the batsman's status
            outBatsman.isOut = false;
            
            // If the batsman was retired, also reset this flag
            if (lastDelivery.wicketType === 'retired') {
                outBatsman.isRetired = false;
            }
            
            // For any type of dismissal, ensure we restore the correct batting positions
            if (lastDelivery.nextBatsmanId) {
                // Find the new batsman who came in after the wicket
                const newBatsman = battingTeam.players.find(
                    p => p.id === lastDelivery.nextBatsmanId
                );
                
                // Restore the outBatsmanId to the correct position (striker/non-striker)
                if (currentInnings.currentStrikerId === lastDelivery.nextBatsmanId) {
                    currentInnings.currentStrikerId = lastDelivery.outBatsmanId;
                } else if (currentInnings.currentNonStrikerId === lastDelivery.nextBatsmanId) {
                    currentInnings.currentNonStrikerId = lastDelivery.outBatsmanId;
                }
                
                // Update the all-out status if this was the last wicket
                if (currentInnings.isAllOut && currentInnings.wickets < battingTeam.players.length - 1) {
                    currentInnings.isAllOut = false;
                }
            } else {
                // Handle case where batsman was out but no replacement came in (all out or end of innings)
                if (lastDelivery.preSwitchStrikerId === lastDelivery.outBatsmanId) {
                    // If the out batsman was the striker, restore them to striker
                    currentInnings.currentStrikerId = lastDelivery.outBatsmanId;
                } else {
                    // Otherwise they were non-striker
                    currentInnings.currentNonStrikerId = lastDelivery.outBatsmanId;
                }
                
                // Update the all-out status
                currentInnings.isAllOut = false;
            }
        }
        
        // Also handle retired batsmen cases
        if (lastDelivery.wicketType === 'retired' && lastDelivery.nextBatsmanId) {
            const retiredBatsman = battingTeam.players.find(
                p => p.id === lastDelivery.outBatsmanId
            );
            
            if (retiredBatsman) {
                retiredBatsman.isRetired = false;
                
                // Restore retired batsman to their original position
                if (lastDelivery.preSwitchStrikerId === lastDelivery.outBatsmanId) {
                    currentInnings.currentStrikerId = lastDelivery.outBatsmanId;
                } else {
                    currentInnings.currentNonStrikerId = lastDelivery.outBatsmanId;
                }
            }
        }
    }
}

function revertBowlerChange(
    currentInnings: InningsData,
    bowlingTeam: Team,
    lastDelivery: any
) {
    // Check if this was the first ball of an over (which might have changed the bowler)
    const wasFirstBallOfOver = 
        lastDelivery.extraType === undefined && 
        currentInnings.deliveries.length > 1 &&
        (currentInnings.deliveries[currentInnings.deliveries.length - 2].overNumber !== 
         lastDelivery.overNumber);

    if (wasFirstBallOfOver) {
        // If we're undoing the first ball of an over, restore the previous bowler
        currentInnings.currentBowlerId = currentInnings.lastOverBowlerId;
    } 
    // Also handle explicit bowler changes
    else if (lastDelivery.changedBowlerId) {
        // Switch back to oldBowlerId
        if (lastDelivery.oldBowlerId) {
            currentInnings.currentBowlerId = lastDelivery.oldBowlerId;
        } else {
            currentInnings.currentBowlerId = undefined;
        }
    }
}

function revertBatsmenSwitchingIfNeeded(
    state: ScoreboardState,
    currentInnings: InningsData,
    wasLastBallOfOver: boolean,
    wasOddRuns: boolean,
    wasLegalDelivery: boolean,
    lastDelivery: any
) {
    // Case 1: Undo last ball of the over
    if (wasLastBallOfOver && wasLegalDelivery) {
        // If it was an even-run ball at the end of an over, we had switched strike at the over end
        const wasOddRunOnLastBall = lastDelivery.runs % 2 === 1;
        if (!wasOddRunOnLastBall) {
            // Switch back if it was even
            updateBatsmenPositions(
                state,
                currentInnings.currentNonStrikerId,
                currentInnings.currentStrikerId
            );
        }

        // We also reset lastOverBowlerId above, if needed
        currentInnings.lastOverBowlerId = undefined;
    }

    // Case 2: For odd runs, always revert the switching
    else if (wasOddRuns) {
        updateBatsmenPositions(
            state,
            currentInnings.currentNonStrikerId,
            currentInnings.currentStrikerId
        );
    }
}

function revertPartnershipStats(
    currentInnings: InningsData,
    lastDelivery: any
) {
    if (!currentInnings.currentPartnership) return;

    // Undo runs from partnership
    currentInnings.currentPartnership.runs -= lastDelivery.totalRuns || 0;

    // Undo ball count if it was a legal delivery
    if (!lastDelivery.extraType ||
        lastDelivery.extraType === 'bye' ||
        lastDelivery.extraType === 'leg-bye') {
        currentInnings.currentPartnership.balls -= 1;
    }

    // If this was a wicket, we need to restore the previous partnership
    if (lastDelivery.wicket && currentInnings.partnerships && currentInnings.partnerships.length > 0) {
        // Get the last partnership
        const lastPartnership = currentInnings.partnerships.pop();
        if (lastPartnership) {
            // Restore it as the current partnership
            currentInnings.currentPartnership = {
                ...lastPartnership,
                isActive: true
            };
        }
    }
}

function revertMatchStatusIfNeeded(
    state: ScoreboardState,
    currentInnings: InningsData
) {
    // If we are undoing a match-winning delivery in the second innings
    state.matchOver = false;
    state.matchResult = undefined;
    currentInnings.isCompleted = false;
    state.alertMessage = undefined;
}

function revertInningsCompletionIfNeeded(
    state: ScoreboardState,
    currentInnings: InningsData,
    battingTeam: Team
) {
    if (!currentInnings.isCompleted) return;

    // For first innings: if now below total overs, it’s not completed
    if (
        state.currentInning === 1 &&
        currentInnings.completedOvers < state.totalOvers
    ) {
        currentInnings.isCompleted = false;
        return;
    }

    // For second innings: if below target and still have wickets, re-open innings
    if (
        state.currentInning === 2 &&
        state.targetScore &&
        currentInnings.totalRuns < state.targetScore &&
        currentInnings.wickets < battingTeam.players.length - 1
    ) {
        currentInnings.isCompleted = false;
    }
}

function revertFielderStats(bowlingTeam: Team, lastDelivery: any) {
    // Only process if there was a wicket with a fielder involved
    if (lastDelivery.wicket && lastDelivery.fielderId) {
        const fielder = bowlingTeam.players.find(p => p.id === lastDelivery.fielderId);
        if (!fielder) return;
        
        // Revert the appropriate fielding stat based on wicket type
        if (lastDelivery.wicketType === 'caught') {
            fielder.catches -= 1;
        } else if (lastDelivery.wicketType === 'run out') {
            fielder.runouts -= 1;
        } else if (lastDelivery.wicketType === 'stumped') {
            fielder.stumps -= 1;
        }
    }
}