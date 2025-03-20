import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState, ScoreBallPayload, Team, InningsData } from '@/types';
import { checkInningsCompletionHelper, calculateRemainingWickets, updateBatsmenPositions } from '@/utils';

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
        updateBowlerStats(bowlingTeam, currentInnings, runs, extraType, wicket, wicketType);

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

            // 1) Mark old batter as out
            const outBatsman = battingTeam.players.find(
                p => p.id === (outBatsmanId || preSwitchStrikerId)
            );
            if (outBatsman) {
                outBatsman.isOut = true;
            }

            // 2) Insert the new batter in place of the out batsman
            //    (We assume you passed nextBatsmanId in your payload)
            if (outBatsman?.id === currentInnings.currentStrikerId) {
                currentInnings.currentStrikerId = nextBatsmanId;
            } else if (outBatsman?.id === currentInnings.currentNonStrikerId) {
                currentInnings.currentNonStrikerId = nextBatsmanId;
            }

            // 3) If this wicket fell on the last ball of the over AND runs are even,
            //    you still do the normal end-of-over strike swap.
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

        // 6) Revert batsmen switching
        revertBatsmenSwitchingIfNeeded(
            state,
            currentInnings,
            wasLastBallOfOver,
            wasOddRuns,
            wasLegalDelivery,
            lastDelivery
        );

        // 7) Revert match status if it was match-winning
        if (wasMatchWinningDelivery) {
            revertMatchStatusIfNeeded(state, currentInnings);
        }

        // 8) Possibly revert innings completion
        revertInningsCompletionIfNeeded(state, currentInnings, battingTeam);

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
    wicketType: string | undefined
) {
    const bowler = bowlingTeam.players.find(
        p => p.id === currentInnings.currentBowlerId
    );
    if (!bowler) return;

    // We don't charge wide runs to the bowler; no-ball is partially charged
    if (extraType === 'no-ball') {
        bowler.runsConceded += 1; // no-ball penalty
        if (runs > 0) {
            bowler.runsConceded += runs;
        }
    } else if (extraType === 'bye' || extraType === 'leg-bye') {
        bowler.ballsThisOver += 1; // still a legal delivery
    } else if (!extraType) {
        // Regular delivery
        bowler.runsConceded += runs;
        bowler.ballsThisOver += 1;
    }

    // Update economy
    const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
    if (totalBalls > 0) {
        bowler.economy = bowler.runsConceded / (totalBalls / 6);
    }

    // If it's a wicket of type other than runout/retired, increment bowler's wickets
    if (wicket && !['runout', 'retired'].includes(wicketType || '')) {
        bowler.wickets += 1;
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
        if ((extraType === 'wide' || extraType === 'no-ball') && runs % 2 === 1) {
            updateBatsmenPositions(
                state,
                currentInnings.currentNonStrikerId,
                currentInnings.currentStrikerId
            );
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

    // Only undo batsman's runs if it wasn't a bye/leg-bye/wide
    if (!lastDelivery.extraType || lastDelivery.extraType === 'no-ball') {
        striker.runs -= lastDelivery.batsmanRuns || 0;
        striker.balls -= 1;
        if (lastDelivery.runs === 4) striker.fours -= 1;
        if (lastDelivery.runs === 6) striker.sixes -= 1;
        striker.strikeRate =
            striker.balls > 0 ? (striker.runs / striker.balls) * 100 : 0;
    }
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

    let totalRunsToUndo = lastDelivery.totalRuns || 0;

    if (lastDelivery.extraType === 'wide') {
        // For wides, do nothing to bowler's runsConceded (assuming it wasn't added there).
    } else if (lastDelivery.extraType === 'no-ball') {
        // For no-balls, remove all runs including penalty
        bowler.runsConceded -= totalRunsToUndo;
    } else if (lastDelivery.extraType === 'bye' || lastDelivery.extraType === 'leg-bye') {
        // Byes/leg-byes are not charged to bowler's runs but do count as a legal ball
        bowler.ballsThisOver -= 1;
    } else {
        // Regular ball
        bowler.runsConceded -= lastDelivery.runs;
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
    }

    // Recalculate economy
    const totalBalls = bowler.overs * 6 + bowler.ballsThisOver;
    bowler.economy = totalBalls > 0 ? bowler.runsConceded / (totalBalls / 6) : 0;
}

function revertInningsStats(currentInnings: InningsData, lastDelivery: any) {
    const totalRunsToUndo = lastDelivery.totalRuns || 0;

    // Undo total runs
    currentInnings.totalRuns -= totalRunsToUndo;

    // Undo extras if applicable
    if (lastDelivery.extraType) {
        if (
            lastDelivery.extraType === 'wide' ||
            lastDelivery.extraType === 'no-ball'
        ) {
            currentInnings.extras -= totalRunsToUndo;
        } else if (
            lastDelivery.extraType === 'bye' ||
            lastDelivery.extraType === 'leg-bye'
        ) {
            currentInnings.extras -= lastDelivery.runs;
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
        currentInnings.wickets -= 1;
        // Revert the outBatsman from isOut = true
        const outBatsman = battingTeam.players.find(
            p => p.id === lastDelivery.outBatsmanId
        );
        if (outBatsman) {
            outBatsman.isOut = false;
        }
        // If a new batsman was assigned, revert that assignment
        if (lastDelivery.nextBatsmanId) {
            // If nextBatsmanId is currently striker, swap it back to outBatsmanId
            if (currentInnings.currentStrikerId === lastDelivery.nextBatsmanId) {
                currentInnings.currentStrikerId = lastDelivery.outBatsmanId;
            } else if (currentInnings.currentNonStrikerId === lastDelivery.nextBatsmanId) {
                currentInnings.currentNonStrikerId = lastDelivery.outBatsmanId;
            }
        }
    }
}

function revertBowlerChange(
    currentInnings: InningsData,
    bowlingTeam: Team,
    lastDelivery: any
) {
    if (lastDelivery.changedBowlerId) {
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