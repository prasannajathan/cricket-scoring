# Cricket Scoring Documentation

## Overview

This application provides comprehensive cricket match scoring capabilities for T20 matches, including super overs, DLS calculations, and power play management.

## Features

### Core Functionality
- Real-time scoring
- Support for T20 format
- Super over handling
- DLS calculations
- Power play management
- Detailed statistics

### Technical Implementation
- Built with React Native and TypeScript
- Redux for state management
- AsyncStorage for persistence
- Jest for testing

## Components

### ScoringScreen
The main scoring interface that handles all match events.

```typescript
interface ScoringProps {
    matchId: string;
    onInningsComplete: () => void;
    onMatchComplete: () => void;
}
```

#### Key Features
- Ball-by-ball scoring
- Extras handling (wides, no-balls, byes, leg-byes)
- Wicket types
- Partnership tracking
- Power play management

### State Management

The application uses Redux with the following structure:

```typescript
interface MatchState {
    id: string;
    currentInning: 1 | 2;
    innings1: InningsState;
    innings2: InningsState;
    teamA: Team;
    teamB: Team;
    matchOver: boolean;
    superOver?: SuperOverState;
}

interface InningsState {
    battingTeamId: string;
    bowlingTeamId: string;
    totalRuns: number;
    wickets: number;
    overs: number;
    ballsInOver: number;
    currentBowlerId: string;
    currentStrikerId: string;
    isComplete: boolean;
}
```

## Error Handling

### Validation Rules
- Batsman and bowler must be selected
- Runs must be non-negative
- Bowler over limits
- Valid match state transitions

```typescript
interface ValidationRule {
    check: (state: MatchState) => boolean;
    message: string;
    errorCode: string;
}
```

## Performance Optimization

### Component Optimization
- Usage of `React.memo` for pure components
- Memoization of expensive calculations
- Batch updates for state changes

```typescript
// Example of optimized component
const ScoreDisplay = React.memo(({ score, wickets }: ScoreDisplayProps) => {
    return <Text>{`${score}/${wickets}`}</Text>;
}, (prev, next) => {
    return prev.score === next.score && prev.wickets === next.wickets;
});
```

## Testing

### Unit Tests
Run the test suite:
```bash
npm test
```

### Test Structure
```typescript
describe('Scoring Module', () => {
    test('should handle valid delivery', () => {
        // Test implementation
    });

    test('should validate bowler overs', () => {
        // Test implementation
    });
});
```

### Test Files
- `__tests__/scoring.test.ts`: Core scoring logic
- `__tests__/validation.test.ts`: Input validation
- `__tests__/matchState.test.ts`: State management

## Development

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Directory Structure
```
cricket-scoring/
├── app/
│   └── (tabs)/
│       └── scoring.tsx
├── components/
│   └── scoring/
├── store/
│   └── cricket/
├── utils/
├── __tests__/
└── docs/
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Submit a pull request

## License

MIT License - See LICENSE file for details