import { PayloadAction } from '@reduxjs/toolkit';
import { ScoreboardState, ScoreBallPayload } from '@/types';

export const scoringReducers = {
    scoreBall: (state: ScoreboardState, action: PayloadAction<ScoreBallPayload>) => {
        if (state.matchOver) return;

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

        // Update innings total and check for completion
        currentInnings.totalRuns += totalRuns;
        
        // Handle ball count and over completion
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