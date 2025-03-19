# Cricket Scoring App

A mobile application for scoring cricket matches with comprehensive statistics, live updates, and detailed player tracking.

## Features

- **Live Scoring**: Ball-by-ball scoring with real-time updates of match progress
- **Complete Match Statistics**: Track runs, wickets, extras, partnerships, and more
- **Player Management**: Record detailed player statistics for batsmen and bowlers
- **Team Management**: Create and manage multiple teams with full player rosters
- **Match Simulation**: Complete support for T20, ODI and other cricket formats
- **End of Over Handling**: Automatic batsmen switching and bowler rotation
- **Wicket Types**: Support for all cricket dismissals (bowled, caught, run out, etc.)
- **Extras**: Track wides, no balls, leg byes, and byes
- **Undo Feature**: Easily correct scoring mistakes with comprehensive undo functionality
- **Detailed Scorecards**: View comprehensive match statistics during and after games
- **Team Statistics**: Analyze player and team performance across multiple matches

## Technical Overview

The Cricket Scoring App is built using:

- **React Native**: Cross-platform mobile application framework
- **Expo**: Development toolchain for React Native
- **Redux**: State management for predictable app state
- **TypeScript**: Type-safe JavaScript for robust code
- **React Navigation**: Navigation library for screen management

## Code Structure
cricket-scoring/
├── app/                  # Main application screens
├── components/           # Reusable UI components
├── constants/            # App constants and theme definitions
├── hooks/                # Custom React hooks
├── store/                # Redux store configuration and slices
│   └── cricket/          # Cricket-specific state management
│       ├── reducers/     # State reducers (scoring, innings, players)
│       └── selectors.ts  # State selectors
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── utils/                # Utility functions

## Key Components

- **Scoring Screen**: Main interface for ball-by-ball scoring with batsmen and bowler displays
- **Scorecard Tab**: Detailed match statistics and player performance overview
- **Player Management**: Interface for adding and editing player details
- **Team Setup**: Team creation and player assignment
- **Match Setup**: Configuration for match parameters (overs, players, etc.)

## State Management

The app uses Redux for state management with specialized slices:
- **scoreboardSlice**: Manages the current match state
- **playerReducers**: Handles player-related state changes
- **inningsReducers**: Controls innings progression and completion
- **scoringReducers**: Manages ball-by-ball scoring logic

## Cricket Logic Implementations

- **End of Over Handling**: Automatic batsman switching and over completion
- **Wicket Processing**: Specialized handling for different dismissal types
- **Extras Calculation**: Proper accounting for wides, no-balls, byes, and leg-byes
- **Batsmen Switching**: Logic for odd runs, end of over, and after wickets
- **Innings Completion**: Handling for all-out, target achieved, and overs completed

## Future Enhancements

- Match history and statistics export
- Offline/online sync capabilities
- Multi-device real-time scoring
- Advanced analytics and visualizations
- Integration with cricket statistics platforms
- Support for additional cricket formats and rules

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/cricket-scoring.git
cd cricket-scoring 
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npx expo start
```