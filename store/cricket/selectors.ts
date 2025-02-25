import { RootState } from '@/store';
import { createSelector } from '@reduxjs/toolkit';
import { TeamId, PlayerId, Innings, Partnership } from '@/types/match';

export const selectCurrentInnings = (state: RootState) => 
  state.scoreboard.innings[state.scoreboard.innings.length - 1];

export const selectTeamById = (teamId: TeamId) => 
  createSelector(
    (state: RootState) => state.scoreboard.teams,
    teams => teams.find(team => team.id === teamId)
  );

export const selectBattingTeam = createSelector(
  (state: RootState) => state.scoreboard.teams,
  teams => teams.find(team => team.isBatting)
);

export const selectBowlingTeam = createSelector(
  (state: RootState) => state.scoreboard.teams,
  teams => teams.find(team => team.isBowling)
);

export const selectPlayerById = (playerId: PlayerId) =>
  createSelector(
    (state: RootState) => state.scoreboard.teams,
    teams => {
      for (const team of teams) {
        const player = team.players.find(p => p.id === playerId);
        if (player) return player;
      }
      return undefined;
    }
  );

export const selectCurrentBowler = (state: RootState) => {
    const bowlingTeam = selectBowlingTeam(state);
    return bowlingTeam.players.find(p => p.id === bowlingTeam.currentBowlerId);
};

export const selectCurrentBatsmen = (state: RootState) => {
    const battingTeam = selectBattingTeam(state);
    return {
        striker: battingTeam.players.find(p => p.id === battingTeam.currentStrikerId),
        nonStriker: battingTeam.players.find(p => p.id === battingTeam.currentNonStrikerId)
    };
};

export const selectMatchProgress = (state: RootState) => {
    const currentInnings = selectCurrentInnings(state);
    return {
        currentOver: currentInnings.completedOvers,
        currentBall: currentInnings.ballInCurrentOver,
        totalOvers: state.scoreboard.totalOvers,
        targetScore: state.scoreboard.targetScore
    };
};

export const selectCurrentPartnership = createSelector(
  selectCurrentInnings,
  (innings): Partnership | undefined => {
    if (!innings?.partnerships.length) return undefined;
    return innings.partnerships[innings.partnerships.length - 1];
  }
);

export const selectRunRate = createSelector(
  selectCurrentInnings,
  (innings): number => {
    if (!innings) return 0;
    const oversPlayed = innings.completedOvers + (innings.ballInCurrentOver / 6);
    return oversPlayed > 0 ? Number((innings.totalRuns / oversPlayed).toFixed(2)) : 0;
  }
);

export const selectRequiredRunRate = createSelector(
  [selectCurrentInnings, (state: RootState) => state.matchDetails],
  (innings, matchDetails): number | null => {
    if (!innings || !matchDetails.targetScore) return null;
    
    const remainingRuns = matchDetails.targetScore - innings.totalRuns;
    const remainingOvers = matchDetails.totalOvers - 
      (innings.completedOvers + (innings.ballInCurrentOver / 6));
    
    return remainingOvers > 0 
      ? Number((remainingRuns / remainingOvers).toFixed(2)) 
      : null;
  }
);

export const selectPlayerStats = (playerId: PlayerId) => createSelector(
  selectCurrentInnings,
  (innings): {
    battingStats: {
      runs: number;
      balls: number;
      strikeRate: number;
    };
    bowlingStats: {
      overs: string;
      wickets: number;
      economy: number;
    };
  } | undefined => {
    if (!innings) return undefined;

    const battingDeliveries = innings.deliveries.filter(
      d => d.batsmanId === playerId && !d.extrasType
    );
    const bowlingDeliveries = innings.deliveries.filter(
      d => d.bowlerId === playerId
    );

    const runs = battingDeliveries.reduce((sum, d) => sum + d.runs, 0);
    const balls = battingDeliveries.length;
    const wickets = bowlingDeliveries.filter(d => d.wicket).length;
    const runsConceded = bowlingDeliveries.reduce((sum, d) => sum + d.runs, 0);
    const legalBalls = bowlingDeliveries.filter(d => !d.extrasType).length;

    return {
      battingStats: {
        runs,
        balls,
        strikeRate: balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0
      },
      bowlingStats: {
        overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
        wickets,
        economy: legalBalls > 0 
          ? Number(((runsConceded * 6) / legalBalls).toFixed(2)) 
          : 0
      }
    };
  }
);

export const selectExtras = createSelector(
  selectCurrentInnings,
  (innings) => innings?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
);

export const selectFallOfWickets = createSelector(
  selectCurrentInnings,
  (innings) => {
    if (!innings) return [];
    
    return innings.deliveries
      .filter(d => d.wicket)
      .map(d => ({
        score: innings.deliveries
          .slice(0, innings.deliveries.indexOf(d) + 1)
          .reduce((sum, del) => sum + del.runs, 0),
        wicketNumber: innings.deliveries
          .filter(del => del.wicket)
          .indexOf(d) + 1,
        batsmanId: d.wicket.dismissedPlayerId,
        bowlerId: d.bowlerId,
        over: Math.floor(innings.deliveries.indexOf(d) / 6) + 1,
        ball: (innings.deliveries.indexOf(d) % 6) + 1
      }));
  }
);

export const selectOverDetails = createSelector(
  selectCurrentInnings,
  (innings): {
    oversPlayed: string;
    runsInOver: number;
    isOverComplete: boolean;
  } => {
    if (!innings) return { oversPlayed: '0.0', runsInOver: 0, isOverComplete: false };

    const currentOverDeliveries = innings.deliveries.slice(
      innings.completedOvers * 6,
      (innings.completedOvers * 6) + innings.ballInCurrentOver
    );

    return {
      oversPlayed: `${innings.completedOvers}.${innings.ballInCurrentOver}`,
      runsInOver: currentOverDeliveries.reduce((sum, d) => sum + d.runs, 0),
      isOverComplete: innings.ballInCurrentOver === 6
    };
  }
);

export const selectProjectedScore = createSelector(
  [selectCurrentInnings, (state: RootState) => state.matchDetails.totalOvers],
  (innings, totalOvers): number => {
    if (!innings) return 0;
    
    const currentRunRate = innings.totalRuns / 
      (innings.completedOvers + (innings.ballInCurrentOver / 6));
    
    return Math.round(currentRunRate * totalOvers);
  }
);

export const selectBoundaries = createSelector(
  selectCurrentInnings,
  (innings): { fours: number; sixes: number } => {
    if (!innings) return { fours: 0, sixes: 0 };

    return innings.deliveries.reduce((acc, delivery) => {
      if (delivery.runs === 4) return { ...acc, fours: acc.fours + 1 };
      if (delivery.runs === 6) return { ...acc, sixes: acc.sixes + 1 };
      return acc;
    }, { fours: 0, sixes: 0 });
  }
);

export const selectDotBallPercentage = createSelector(
  selectCurrentInnings,
  (innings): number => {
    if (!innings) return 0;
    
    const legalDeliveries = innings.deliveries.filter(d => !d.extrasType);
    const dotBalls = legalDeliveries.filter(d => d.runs === 0).length;
    
    return legalDeliveries.length > 0
      ? Number(((dotBalls / legalDeliveries.length) * 100).toFixed(1))
      : 0;
  }
);

export const selectMatchSummary = createSelector(
  [selectCurrentInnings, selectBattingTeam, selectBowlingTeam],
  (innings, battingTeam, bowlingTeam) => {
    if (!innings || !battingTeam || !bowlingTeam) return null;

    const { totalRuns, wickets, completedOvers, ballInCurrentOver } = innings;
    const oversPlayed = completedOvers + (ballInCurrentOver / 6);
    
    return {
      score: `${totalRuns}/${wickets}`,
      overs: `${completedOvers}.${ballInCurrentOver}`,
      runRate: Number((totalRuns / oversPlayed).toFixed(2)),
      battingTeam: battingTeam.teamName,
      bowlingTeam: bowlingTeam.teamName,
      ...selectBoundaries({ scoreboard: { innings: [innings] } } as RootState),
      dotBallPercentage: selectDotBallPercentage({ 
        scoreboard: { innings: [innings] } 
      } as RootState)
    };
  }
);

export const selectPartnershipRecords = createSelector(
  selectCurrentInnings,
  (innings): {
    highest: Partnership & { runs: number };
    current: Partnership & { runs: number } | null;
    all: (Partnership & { runs: number })[];
  } => {
    if (!innings) return { highest: null, current: null, all: [] };

    const partnerships = innings.partnerships.map(p => ({
      ...p,
      runs: innings.deliveries
        .slice(p.startDelivery, p.endDelivery || innings.deliveries.length)
        .reduce((sum, d) => sum + d.runs, 0)
    }));

    return {
      highest: [...partnerships].sort((a, b) => b.runs - a.runs)[0],
      current: partnerships[partnerships.length - 1],
      all: partnerships
    };
  }
);

export const selectMatchMilestones = createSelector(
  selectCurrentInnings,
  (innings): {
    fifties: { playerId: string; balls: number }[];
    hundreds: { playerId: string; balls: number }[];
    teamMilestones: { runs: number; over: number }[];
  } => {
    if (!innings) return { fifties: [], hundreds: [], teamMilestones: [] };

    const playerRuns: { [key: string]: { runs: number; balls: number } } = {};
    const teamMilestones: { runs: number; over: number }[] = [];
    let totalRuns = 0;

    innings.deliveries.forEach((d, idx) => {
      if (!d.extrasType) {
        if (!playerRuns[d.batsmanId]) {
          playerRuns[d.batsmanId] = { runs: 0, balls: 0 };
        }
        playerRuns[d.batsmanId].runs += d.runs;
        playerRuns[d.batsmanId].balls++;
      }

      totalRuns += d.runs;
      if (totalRuns >= 50 && Math.floor(totalRuns / 50) > teamMilestones.length) {
        teamMilestones.push({
          runs: Math.floor(totalRuns / 50) * 50,
          over: Math.floor(idx / 6)
        });
      }
    });

    return {
      fifties: Object.entries(playerRuns)
        .filter(([_, stats]) => stats.runs >= 50 && stats.runs < 100)
        .map(([id, stats]) => ({ playerId: id, balls: stats.balls })),
      hundreds: Object.entries(playerRuns)
        .filter(([_, stats]) => stats.runs >= 100)
        .map(([id, stats]) => ({ playerId: id, balls: stats.balls })),
      teamMilestones
    };
  }
);

export const selectBestPerformances = createSelector(
  selectCurrentInnings,
  (innings): {
    batting: { playerId: string; runs: number; strikeRate: number }[];
    bowling: { playerId: string; wickets: number; economy: number }[];
  } => {
    if (!innings) return { batting: [], bowling: [] };

    const battingStats: { [key: string]: { runs: number; balls: number } } = {};
    const bowlingStats: { [key: string]: { wickets: number; runs: number; balls: number } } = {};

    innings.deliveries.forEach(d => {
      if (!d.extrasType) {
        if (!battingStats[d.batsmanId]) {
          battingStats[d.batsmanId] = { runs: 0, balls: 0 };
        }
        battingStats[d.batsmanId].runs += d.runs;
        battingStats[d.batsmanId].balls++;
      }

      if (!bowlingStats[d.bowlerId]) {
        bowlingStats[d.bowlerId] = { wickets: 0, runs: 0, balls: 0 };
      }
      bowlingStats[d.bowlerId].runs += d.runs;
      if (!d.extrasType) bowlingStats[d.bowlerId].balls++;
      if (d.wicket) bowlingStats[d.bowlerId].wickets++;
    });

    return {
      batting: Object.entries(battingStats)
        .map(([id, stats]) => ({
          playerId: id,
          runs: stats.runs,
          strikeRate: Number(((stats.runs / stats.balls) * 100).toFixed(2))
        }))
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 3),
      bowling: Object.entries(bowlingStats)
        .map(([id, stats]) => ({
          playerId: id,
          wickets: stats.wickets,
          economy: Number(((stats.runs * 6) / stats.balls).toFixed(2))
        }))
        .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)
        .slice(0, 3)
    };
  }
);

export const selectTeamComparison = createSelector(
  (state: RootState) => state.scoreboard.innings,
  (innings): {
    runRateComparison: { team1: number; team2: number };
    powerPlayComparison: { team1: number; team2: number };
    boundaryComparison: { team1: number; team2: number };
  } => {
    if (innings.length < 2) {
      return {
        runRateComparison: { team1: 0, team2: 0 },
        powerPlayComparison: { team1: 0, team2: 0 },
        boundaryComparison: { team1: 0, team2: 0 }
      };
    }

    const [innings1, innings2] = innings;

    return {
      runRateComparison: {
        team1: Number((innings1.totalRuns / (innings1.completedOvers + innings1.ballInCurrentOver / 6)).toFixed(2)),
        team2: Number((innings2.totalRuns / (innings2.completedOvers + innings2.ballInCurrentOver / 6)).toFixed(2))
      },
      powerPlayComparison: {
        team1: innings1.deliveries.slice(0, 36).reduce((sum, d) => sum + d.runs, 0),
        team2: innings2.deliveries.slice(0, 36).reduce((sum, d) => sum + d.runs, 0)
      },
      boundaryComparison: {
        team1: innings1.deliveries.filter(d => d.runs === 4 || d.runs === 6).length,
        team2: innings2.deliveries.filter(d => d.runs === 4 || d.runs === 6).length
      }
    };
  }
);

export const selectMatchStatus = createSelector(
  (state: RootState) => state.scoreboard.matchDetails,
  details => ({
    isComplete: details.matchOver,
    result: details.matchResult,
    targetScore: details.targetScore
  })
);