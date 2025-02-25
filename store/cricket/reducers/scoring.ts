import { PayloadAction } from '@reduxjs/toolkit';
import { MatchState, DeliveryDetails, DismissalInfo } from '@/types/match';
import { BALLS_PER_OVER } from '@/constants/scoring';

export const scoringReducers = {
  scoreBall: (
    state: MatchState,
    action: PayloadAction<{
      delivery: DeliveryDetails;
      dismissalInfo?: DismissalInfo;
    }>
  ) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings || state.matchDetails.matchOver) return;

    const { delivery, dismissalInfo } = action.payload;
    const battingTeam = state.teams.find(t => t.id === currentInnings.battingTeamId);
    const bowlingTeam = state.teams.find(t => t.id === currentInnings.bowlingTeamId);

    if (!battingTeam || !bowlingTeam) return;

    // Update delivery stats
    currentInnings.deliveries.push(delivery);
    currentInnings.totalRuns += delivery.runs;

    // Update extras
    if (delivery.extrasType) {
      const extrasType = delivery.extrasType;
      currentInnings.extras[extrasType === 'wide' ? 'wides' : 
                           extrasType === 'no-ball' ? 'noBalls' :
                           extrasType === 'bye' ? 'byes' : 'legByes'] += 1;
    }

    // Update ball count
    const isLegalDelivery = !delivery.extrasType || 
                           delivery.extrasType === 'bye' || 
                           delivery.extrasType === 'leg-bye';

    if (isLegalDelivery) {
      currentInnings.ballInCurrentOver++;
      if (currentInnings.ballInCurrentOver === BALLS_PER_OVER) {
        currentInnings.completedOvers++;
        currentInnings.ballInCurrentOver = 0;
        // Swap batsmen at end of over
        [currentInnings.currentStrikerId, currentInnings.currentNonStrikerId] = 
          [currentInnings.currentNonStrikerId, currentInnings.currentStrikerId];
      }
    }

    // Update batting stats
    if (!delivery.extrasType || delivery.extrasType === 'no-ball') {
      const striker = battingTeam.players.find(p => p.id === delivery.batsmanId);
      if (striker) {
        striker.statistics.batting.runs += delivery.runs;
        striker.statistics.batting.ballsFaced++;
        if (delivery.runs === 4) striker.statistics.batting.fours++;
        if (delivery.runs === 6) striker.statistics.batting.sixes++;
        striker.statistics.batting.strikeRate = 
          (striker.statistics.batting.runs / striker.statistics.batting.ballsFaced) * 100;
      }
    }

    // Update bowling stats
    const bowler = bowlingTeam.players.find(p => p.id === delivery.bowlerId);
    if (bowler) {
      bowler.statistics.bowling.runsConceded += delivery.runs;
      if (isLegalDelivery) {
        bowler.statistics.bowling.ballsInOver++;
        if (bowler.statistics.bowling.ballsInOver === BALLS_PER_OVER) {
          bowler.statistics.bowling.overs++;
          bowler.statistics.bowling.ballsInOver = 0;
        }
      }
      bowler.statistics.bowling.economy = 
        (bowler.statistics.bowling.runsConceded / 
         (bowler.statistics.bowling.overs + bowler.statistics.bowling.ballsInOver / BALLS_PER_OVER)) * 6;
    }

    // Handle wicket
    if (dismissalInfo) {
      currentInnings.wickets++;
      const dismissedPlayer = battingTeam.players.find(p => p.id === dismissalInfo.dismissedPlayerId);
      if (dismissedPlayer) {
        dismissedPlayer.statistics.batting.dismissalInfo = dismissalInfo;
      }
    }

    // Check innings completion
    if (currentInnings.wickets === 10 || 
        (currentInnings.completedOvers >= state.matchDetails.totalOvers && 
         currentInnings.ballInCurrentOver === 0)) {
      currentInnings.isCompleted = true;
    }
  },

  addDelivery: (
    state,
    action: PayloadAction<{
      delivery: DeliveryDetails;
      dismissalInfo?: DismissalInfo;
    }>
  ) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    currentInnings.deliveries.push(action.payload.delivery);
    currentInnings.totalRuns += action.payload.delivery.runs;

    if (action.payload.dismissalInfo) {
      currentInnings.wickets += 1;
    }

    // Update batting and bowling statistics
    const batsman = state.teams
      .find(t => t.id === currentInnings.battingTeamId)
      ?.players.find(p => p.id === action.payload.delivery.batsmanId);

    const bowler = state.teams
      .find(t => t.id === currentInnings.bowlingTeamId)
      ?.players.find(p => p.id === action.payload.delivery.bowlerId);

    if (batsman && !action.payload.delivery.extrasType) {
      batsman.statistics.batting.runs += action.payload.delivery.runs;
      batsman.statistics.batting.ballsFaced += 1;
    }

    if (bowler) {
      bowler.statistics.bowling.runsConceded += action.payload.delivery.runs;
      bowler.statistics.bowling.ballsInOver += 1;
    }
  },

  undoLastBall: (state: MatchState) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings || !currentInnings.deliveries.length) return;

    const lastDelivery = currentInnings.deliveries[currentInnings.deliveries.length - 1];
    const battingTeam = state.teams.find(t => t.id === currentInnings.battingTeamId);
    const bowlingTeam = state.teams.find(t => t.id === currentInnings.bowlingTeamId);

    if (!battingTeam || !bowlingTeam) return;

    // Undo batsman stats
    const striker = battingTeam.players.find(p => p.id === lastDelivery.batsmanId);
    if (striker && (!lastDelivery.extrasType || lastDelivery.extrasType === 'no-ball')) {
      striker.statistics.batting.runs -= lastDelivery.runs;
      striker.statistics.batting.ballsFaced--;
      if (lastDelivery.runs === 4) striker.statistics.batting.fours--;
      if (lastDelivery.runs === 6) striker.statistics.batting.sixes--;
      striker.statistics.batting.strikeRate = striker.statistics.batting.ballsFaced > 0 
        ? (striker.statistics.batting.runs / striker.statistics.batting.ballsFaced) * 100 
        : 0;
    }

    // Undo bowler stats
    const bowler = bowlingTeam.players.find(p => p.id === lastDelivery.bowlerId);
    if (bowler) {
      bowler.statistics.bowling.runsConceded -= lastDelivery.runs;
      if (!lastDelivery.extrasType || lastDelivery.extrasType === 'bye' || lastDelivery.extrasType === 'leg-bye') {
        bowler.statistics.bowling.ballsInOver--;
        if (bowler.statistics.bowling.ballsInOver < 0) {
          bowler.statistics.bowling.overs--;
          bowler.statistics.bowling.ballsInOver = 5;
        }
      }
      if (lastDelivery.wicket) {
        bowler.statistics.bowling.wickets--;
      }
      bowler.statistics.bowling.economy = 
        (bowler.statistics.bowling.runsConceded / 
         (bowler.statistics.bowling.overs + bowler.statistics.bowling.ballsInOver / BALLS_PER_OVER)) * 6;
    }

    // Undo extras
    if (lastDelivery.extrasType) {
      const extrasType = lastDelivery.extrasType;
      currentInnings.extras[extrasType === 'wide' ? 'wides' : 
                           extrasType === 'no-ball' ? 'noBalls' :
                           extrasType === 'bye' ? 'byes' : 'legByes']--;
    }

    // Undo ball count and runs
    currentInnings.totalRuns -= lastDelivery.runs;
    if (!lastDelivery.extrasType || lastDelivery.extrasType === 'bye' || lastDelivery.extrasType === 'leg-bye') {
      currentInnings.ballInCurrentOver--;
      if (currentInnings.ballInCurrentOver < 0) {
        currentInnings.completedOvers--;
        currentInnings.ballInCurrentOver = 5;
        // Swap batsmen back at over boundary
        [currentInnings.currentStrikerId, currentInnings.currentNonStrikerId] = 
          [currentInnings.currentNonStrikerId, currentInnings.currentStrikerId];
      }
    }

    // Undo wicket
    if (lastDelivery.wicket) {
      currentInnings.wickets--;
      const dismissedPlayer = battingTeam.players.find(
        p => p.id === lastDelivery.wicket?.dismissedPlayerId
      );
      if (dismissedPlayer) {
        dismissedPlayer.statistics.batting.dismissalInfo = null;
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

  swapBatsmen: (state: MatchState) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    [currentInnings.currentStrikerId, currentInnings.currentNonStrikerId] = 
      [currentInnings.currentNonStrikerId, currentInnings.currentStrikerId];
  },

  retireBatsman: (
    state: MatchState,
    action: PayloadAction<{
      batsmanId: string;
      retirementType: 'hurt' | 'out' | 'tactical'
    }>
  ) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    const battingTeam = state.teams.find(t => t.id === currentInnings.battingTeamId);
    if (!battingTeam) return;

    const batsman = battingTeam.players.find(p => p.id === action.payload.batsmanId);
    if (!batsman) return;

    // Update batsman statistics
    batsman.statistics.batting.dismissalInfo = {
      type: 'retired',
      dismissedPlayerId: action.payload.batsmanId,
      retirementType: action.payload.retirementType
    };

    // Update striker/non-striker
    if (currentInnings.currentStrikerId === action.payload.batsmanId) {
      currentInnings.currentStrikerId = null;
    } else if (currentInnings.currentNonStrikerId === action.payload.batsmanId) {
      currentInnings.currentNonStrikerId = null;
    }

    // End current partnership
    if (currentInnings.partnerships.length > 0) {
      const currentPartnership = currentInnings.partnerships[currentInnings.partnerships.length - 1];
      currentPartnership.isActive = false;
      currentPartnership.endTime = Date.now();
    }
  },

  addNewBatsman: (
    state: MatchState,
    action: PayloadAction<{ 
      batsmanId: string;
      position: 'striker' | 'nonStriker'
    }>
  ) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    if (action.payload.position === 'striker') {
      currentInnings.currentStrikerId = action.payload.batsmanId;
    } else {
      currentInnings.currentNonStrikerId = action.payload.batsmanId;
    }

    // Start new partnership if both batsmen are present
    if (currentInnings.currentStrikerId && currentInnings.currentNonStrikerId) {
      currentInnings.partnerships.push({
        batsman1Id: currentInnings.currentStrikerId,
        batsman2Id: currentInnings.currentNonStrikerId,
        runs: 0,
        balls: 0,
        startTime: Date.now(),
        isActive: true
      });
    }
  },

  updatePartnership: (state: MatchState) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    const currentPartnership = currentInnings.partnerships[currentInnings.partnerships.length - 1];
    const lastDelivery = currentInnings.deliveries[currentInnings.deliveries.length - 1];

    if (!currentPartnership) {
      // Start new partnership
      currentInnings.partnerships.push({
        batsman1Id: currentInnings.currentStrikerId!,
        batsman2Id: currentInnings.currentNonStrikerId!,
        runs: lastDelivery.runs,
        balls: isLegalDelivery(lastDelivery) ? 1 : 0,
        startTime: lastDelivery.timestamp,
        isActive: true
      });
    } else {
      // Update existing partnership
      currentPartnership.runs += lastDelivery.runs;
      if (isLegalDelivery(lastDelivery)) {
        currentPartnership.balls++;
      }
    }
  },

  endPartnership: (state: MatchState, action: PayloadAction<{ wicketType: string }>) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings?.partnerships.length) return;

    const currentPartnership = currentInnings.partnerships[currentInnings.partnerships.length - 1];
    currentPartnership.isActive = false;

    // Start new partnership if not all out
    if (currentInnings.wickets < 10) {
      currentInnings.partnerships.push({
        batsman1Id: currentInnings.currentStrikerId!,
        batsman2Id: currentInnings.currentNonStrikerId!,
        runs: 0,
        balls: 0,
        startTime: Date.now(),
        isActive: true
      });
    }
  },

  updatePowerPlay: (
    state: MatchState,
    action: PayloadAction<{
      type: PowerPlayType;
      startOver: number;
      endOver: number;
      maxFielders: number;
    }>
  ) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    // Validate power play rules
    const { type, startOver, endOver, maxFielders } = action.payload;
    const existingPowerPlay = currentInnings.powerPlays?.find(pp => 
      (startOver >= pp.startOver && startOver <= pp.endOver) ||
      (endOver >= pp.startOver && endOver <= pp.endOver)
    );

    if (existingPowerPlay) return; // Power play periods cannot overlap

    currentInnings.powerPlays = currentInnings.powerPlays || [];
    currentInnings.powerPlays.push({
      type,
      startOver,
      endOver,
      maxFielders
    });
  },

  handleEndOfOver: (state: MatchState) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    // Check for maiden over
    const lastOverDeliveries = currentInnings.deliveries.slice(-6);
    const isMaidenOver = lastOverDeliveries.every(d => d.runs === 0 && !d.extrasType);
    
    if (isMaidenOver) {
      const bowler = state.teams
        .find(t => t.id === currentInnings.bowlingTeamId)
        ?.players.find(p => p.id === currentInnings.currentBowlerId);
      
      if (bowler) {
        bowler.statistics.bowling.maidens++;
      }
    }

    // Update required run rate if chasing
    if (state.matchDetails.targetScore) {
      const remainingRuns = state.matchDetails.targetScore - currentInnings.totalRuns;
      const remainingOvers = state.matchDetails.totalOvers - currentInnings.completedOvers;
      currentInnings.requiredRunRate = remainingOvers > 0 ? remainingRuns / remainingOvers : 99.99;
    }
  },

  handleEndOfInnings: (state: MatchState) => {
    const currentInnings = state.innings[state.innings.length - 1];
    if (!currentInnings) return;

    currentInnings.isCompleted = true;

    // Close any active partnership
    const activePartnership = currentInnings.partnerships.find(p => p.isActive);
    if (activePartnership) {
      activePartnership.isActive = false;
      activePartnership.endTime = Date.now();
    }

    // Update match details for second innings
    if (state.innings.length === 1) {
      state.matchDetails.targetScore = currentInnings.totalRuns + 1;
      
      // Start second innings
      state.innings.push({
        id: crypto.randomUUID(),
        ballInCurrentOver: 0,
        battingTeamId: currentInnings.bowlingTeamId,
        bowlingTeamId: currentInnings.battingTeamId,
        completedOvers: 0,
        currentBowlerId: null,
        currentStrikerId: null,
        currentNonStrikerId: null,
        deliveries: [],
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        isCompleted: false,
        partnerships: [],
        totalRuns: 0,
        wickets: 0,
        powerPlays: []
      });

      // Switch batting/bowling status
      state.teams.forEach(team => {
        team.isBatting = team.id === currentInnings.bowlingTeamId;
        team.isBowling = team.id === currentInnings.battingTeamId;
      });
    } else {
      // End of match
      state.matchDetails.matchOver = true;
      state.matchDetails.matchResult = determineMatchResult(state);
    }
  }
};

// Helper function to check if delivery is legal
const isLegalDelivery = (delivery: DeliveryDetails): boolean => {
  return !delivery.extrasType || delivery.extrasType === 'bye' || delivery.extrasType === 'leg-bye';
};

// Helper function to determine match result
const determineMatchResult = (state: MatchState): string => {
  const [innings1, innings2] = state.innings;
  const margin = Math.abs(innings1.totalRuns - innings2.totalRuns);
  
  if (innings2.totalRuns > innings1.totalRuns) {
    return `${state.teams.find(t => t.id === innings2.battingTeamId)?.teamName} won by ${
      10 - innings2.wickets} wickets`;
  } else if (innings1.totalRuns > innings2.totalRuns) {
    return `${state.teams.find(t => t.id === innings1.battingTeamId)?.teamName} won by ${
      margin} runs`;
  } else {
    return 'Match tied';
  }
};