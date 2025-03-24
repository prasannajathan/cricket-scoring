import { store } from '@/store';
import { 
  scoreBall, 
  setTeamName, 
  setTeam, 
  initializeMatch, 
  setTossWinner, 
  setTossChoice, 
  setTotalOvers, 
  initializeInnings, 
  setBowler,
  setCurrentStriker,
  setCurrentNonStriker
} from '@/store/cricket/scoreboardSlice';
import { createCricketer } from '@/utils';
import { Team, Cricketer } from '@/types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate random number within range
const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Configure simulation parameters
interface SimulationConfig {
  totalOvers: number;
  totalPlayers: number;
  battingSkill: number; // 1-10 (higher means better batting)
  bowlingSkill: number; // 1-10 (higher means better bowling)
}

const defaultConfig: SimulationConfig = {
  totalOvers: 20,
  totalPlayers: 11,
  battingSkill: 6,  // Medium batting (5-7 runs per over on average)
  bowlingSkill: 6   // Medium bowling (a wicket every 20-25 balls)
};

// Create a team with randomized players
const createTeamWithPlayers = (teamName: string, teamId: string, playerCount: number): Team => {
  const players: Cricketer[] = [];
  
  for (let i = 1; i <= playerCount; i++) {
    const playerId = uuidv4();
    const position = i <= 7 ? 'Batter' : 'Bowler';
    players.push(createCricketer(playerId, `${teamName} ${position} ${i}`));
  }
  
  return {
    id: teamId,
    teamName,
    players,
    currentStrikerId: '',
    currentNonStrikerId: '',
    currentBowlerId: '',
    isBatting: false,
    isBowling: false,
    tossWinner: false
  };
};

// Execute a delivery with randomized outcome
const simulateDelivery = (
  battingSkill: number, 
  bowlingSkill: number, 
  ballsPlayed: number,
  wicketsFallen: number,
  maxWickets: number
): { 
  runs: number; 
  isWicket: boolean; 
  isExtra: boolean;
  extraType?: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
} => {
  // Calculate probabilities based on skills and game situation
  const wicketProbability = (bowlingSkill / 10) * (1 + (ballsPlayed / 120) * 0.5);
  const dotBallProbability = (bowlingSkill / 10) * (1 - (ballsPlayed / 120) * 0.3);
  const boundaryProbability = (battingSkill / 10) * (1 + (ballsPlayed / 120) * 0.4);
  const extraProbability = 0.08; // 8% chance of extras
  
  // More aggressive batting in death overs or when many wickets are left
  const wicketsLeft = maxWickets - wicketsFallen;
  const aggressionFactor = Math.min(1.5, 1 + (ballsPlayed / 120) + (wicketsLeft / maxWickets));
  
  // Determine if it's an extra
  const isExtra = Math.random() < extraProbability;
  let extraType: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | undefined;
  
  if (isExtra) {
    const extraTypes = ['wide', 'no-ball', 'bye', 'leg-bye'];
    extraType = extraTypes[randomInt(0, 3)] as any;
  }
  
  // Determine if it's a wicket (no wickets on extras except run out)
  const isWicket = !isExtra && Math.random() < (wicketProbability / 20) && wicketsFallen < maxWickets - 1;
  
  // Determine runs scored
  let runs = 0;
  
  if (isExtra) {
    // Extra runs
    if (extraType === 'wide' || extraType === 'no-ball') {
      const additionalRuns = Math.random() < 0.2 ? randomInt(1, 4) : 0;
      runs = additionalRuns; // The 1-run penalty is handled by the scoring system
    } else {
      // Byes and leg byes
      runs = Math.random() < 0.3 ? randomInt(1, 4) : 1;
    }
  } else if (isWicket) {
    // A wicket may or may not have runs
    runs = Math.random() < 0.1 ? 1 : 0;
  } else {
    // Normal delivery
    if (Math.random() < dotBallProbability) {
      runs = 0; // Dot ball
    } else if (Math.random() < boundaryProbability) {
      runs = Math.random() < (battingSkill / 15) ? 6 : 4; // Six or four
    } else {
      // 1, 2, or 3 runs
      const runProbs = [0.7, 0.25, 0.05]; // 70% singles, 25% doubles, 5% triples
      const runOptions = [1, 2, 3];
      const runIndex = randomInt(0, 99);
      
      if (runIndex < 70) runs = 1;
      else if (runIndex < 95) runs = 2;
      else runs = 3;
    }
  }
  
  return { runs, isWicket, isExtra, extraType };
};

// Simulate a full innings
const simulateInnings = async (
  config: SimulationConfig,
  currentInnings: 1 | 2,
  targetScore?: number
) => {
  const state = store.getState().scoreboard;
  const currentInningsData = currentInnings === 1 ? state.innings1 : state.innings2;
  const battingTeamId = currentInningsData.battingTeamId;
  const bowlingTeamId = currentInningsData.bowlingTeamId;
  const battingTeam = battingTeamId === state.teamA.id ? state.teamA : state.teamB;
  const bowlingTeam = bowlingTeamId === state.teamA.id ? state.teamA : state.teamB;

  // Setup initial batsmen and bowler
  const striker = battingTeam.players[0];
  const nonStriker = battingTeam.players[1];
  const bowler = bowlingTeam.players[6]; // Start with a bowler
  
  store.dispatch(setCurrentStriker({ 
    team: battingTeamId === state.teamA.id ? 'teamA' : 'teamB', 
    playerId: striker.id 
  }));
  
  store.dispatch(setCurrentNonStriker({ 
    team: battingTeamId === state.teamA.id ? 'teamA' : 'teamB', 
    playerId: nonStriker.id 
  }));
  
  store.dispatch(setBowler({ 
    team: bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB', 
    bowlerId: bowler.id 
  }));

  // Keep track of bowling rotation
  const bowlers = bowlingTeam.players.slice(6); // Use players 7-11 as bowlers
  let currentBowlerIndex = 0;
  let previousBowlerIndex = -1;
  
  // Keep track of batting order
  let nextBatsmanIndex = 2; // Next batsman (players 0 and 1 are already batting)
  
  // Simulate the innings
  let ballsPlayed = 0;
  let wicketsFallen = 0;
  let maxWickets = config.totalPlayers - 1;
  let isInningsOver = false;
  let ballDelay = 300; // milliseconds between balls for smoother simulation
  
  console.log(`Starting ${currentInnings === 1 ? 'first' : 'second'} innings simulation`);
  
  for (let over = 0; over < config.totalOvers && !isInningsOver; over++) {
    // Change bowler at the start of each over
    if (over > 0) {
      // Ensure no bowler bowls consecutive overs
      do {
        currentBowlerIndex = (currentBowlerIndex + 1) % bowlers.length;
      } while (currentBowlerIndex === previousBowlerIndex);
      
      previousBowlerIndex = currentBowlerIndex;
      
      // Set new bowler
      store.dispatch(setBowler({ 
        team: bowlingTeamId === state.teamA.id ? 'teamA' : 'teamB', 
        bowlerId: bowlers[currentBowlerIndex].id 
      }));
      
      // Small delay before starting new over
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    for (let ball = 0; ball < 6 && !isInningsOver; ball++) {
      // Simulate this delivery
      const delivery = simulateDelivery(
        config.battingSkill, 
        config.bowlingSkill, 
        ballsPlayed,
        wicketsFallen,
        maxWickets
      );
      
      // Wait a bit between deliveries
      await new Promise(resolve => setTimeout(resolve, ballDelay));
      
      // Update counters
      if (!delivery.isExtra || (delivery.extraType !== 'wide' && delivery.extraType !== 'no-ball')) {
        ballsPlayed++;
      }
      
      // Process the delivery
      if (delivery.isWicket) {
        wicketsFallen++;
        
        // Determine wicket type
        const wicketTypes = ['bowled', 'caught', 'lbw', 'run out', 'stumped'];
        const wicketType = wicketTypes[randomInt(0, delivery.runs > 0 ? 3 : 2)];
        
        // Get next batsman if available
        let nextBatsmanId = '';
        if (nextBatsmanIndex < config.totalPlayers) {
          nextBatsmanId = battingTeam.players[nextBatsmanIndex].id;
          nextBatsmanIndex++;
        }
        
        // Determine fielder for caught/stumped/run out
        let fielderId;
        if (wicketType === 'caught' || wicketType === 'stumped' || wicketType === 'run out') {
          const fielderIndex = randomInt(0, bowlingTeam.players.length - 1);
          fielderId = bowlingTeam.players[fielderIndex].id;
        }
        
        // Score the wicket
        store.dispatch(scoreBall({
          runs: delivery.runs,
          wicket: true,
          wicketType,
          outBatsmanId: currentInningsData.currentStrikerId || '',
          nextBatsmanId,
          fielderId
        }));
        
        // Check if innings is over
        const updatedState = store.getState().scoreboard;
        isInningsOver = wicketsFallen >= maxWickets || 
                        updatedState.matchOver || 
                        (currentInnings === 2 && targetScore && updatedState.innings2.totalRuns >= targetScore);
      } else if (delivery.isExtra) {
        // Score an extra
        store.dispatch(scoreBall({
          runs: delivery.runs,
          extraType: delivery.extraType
        }));
      } else {
        // Normal runs
        store.dispatch(scoreBall({ runs: delivery.runs }));
      }
      
      // Check if target reached in second innings
      if (currentInnings === 2 && targetScore) {
        const updatedState = store.getState().scoreboard;
        if (updatedState.innings2.totalRuns >= targetScore) {
          isInningsOver = true;
          console.log('Target reached, second innings over');
        }
      }
    }
    
    // Check innings state after each over
    const updatedState = store.getState().scoreboard;
    isInningsOver = updatedState.matchOver || 
                    (currentInnings === 1 && updatedState.innings1.isCompleted) ||
                    (currentInnings === 2 && updatedState.innings2.isCompleted);
  }
  
  console.log(`${currentInnings === 1 ? 'First' : 'Second'} innings completed`);
  return store.getState().scoreboard;
};

// Main function to simulate a complete match
export const simulateMatch = async (config: SimulationConfig = defaultConfig) => {
  console.log('Starting match simulation...');
  
  // 1. Setup teams
  const teamAId = uuidv4();
  const teamBId = uuidv4();
  
  const teamA = createTeamWithPlayers('Team A', teamAId, config.totalPlayers);
  const teamB = createTeamWithPlayers('Team B', teamBId, config.totalPlayers);
  
  store.dispatch(setTeamName({ team: 'teamA', name: 'Team A' }));
  store.dispatch(setTeamName({ team: 'teamB', name: 'Team B' }));
  
  store.dispatch(setTeam({ team: 'teamA', teamData: teamA }));
  store.dispatch(setTeam({ team: 'teamB', teamData: teamB }));
  
  // 2. Initialize match
  store.dispatch(setTotalOvers(config.totalOvers));
  store.dispatch(initializeMatch());
  
  // 3. Set toss - Team A wins and elects to bat
  store.dispatch(setTossWinner('teamA'));
  store.dispatch(setTossChoice('bat'));
  
  // 4. Initialize first innings
  store.dispatch(initializeInnings({ 
    battingTeamId: teamAId, 
    bowlingTeamId: teamBId 
  }));
  
  // 5. Simulate first innings
  await simulateInnings(config, 1);
  
  // 6. Initialize second innings
  const firstInningsState = store.getState().scoreboard;
  const targetScore = firstInningsState.innings1.totalRuns + 1;
  
  console.log(`First innings score: ${firstInningsState.innings1.totalRuns}/${firstInningsState.innings1.wickets}`);
  console.log(`Target for second innings: ${targetScore}`);
  
  // Wait before starting second innings
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  store.dispatch(initializeInnings({
    battingTeamId: teamBId,
    bowlingTeamId: teamAId
  }));
  
  // 7. Simulate second innings
  await simulateInnings(config, 2, targetScore);
  
  // 8. Return final match state
  const finalState = store.getState().scoreboard;
  console.log(`Match completed: ${finalState.matchResult}`);
  return finalState;
};

// Example usage:
// import { simulateMatch } from '@/utils/simulateMatch';
//
// const runTest = async () => {
//   const result = await simulateMatch({
//     totalOvers: 20,
//     totalPlayers: 11,
//     battingSkill: 7,
//     bowlingSkill: 6
//   });
//   console.log('Final result:', result.matchResult);
// };