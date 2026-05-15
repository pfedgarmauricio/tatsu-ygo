export type Format = 'Advanced' | 'Genesys 100' | 'Edison' | 'Mas Odiados' | 'Tag';

export interface Player {
  id: string;
  name: string;
  active: boolean; // false if dropped
  // Statistics (calculated)
  matchPoints: number;
  gamesWon: number;
  gamesPlayed: number;
  gameWinPct: number;
  oppMatchWinPct: number;
  oppGameWinPct: number;
  // History
  opponents: string[];
}

export interface Match {
  id: string;
  round: number;
  playerA: string;
  playerB: string | null; // null if Bye
  scoreA: number; // Games won by A
  scoreB: number; // Games won by B
  isBye: boolean;
  completed: boolean;
}

export interface TournamentState {
  id: string; // e.g., tatsu-ygo-2026-05-14
  date: string;
  format: Format;
  players: Player[];
  matches: Match[];
  currentRound: number;
  totalRounds: number;
  isStarted: boolean;
  isFinished: boolean;
  timerDuration: number; // in seconds
  timerStartedAt: number | null; // timestamp
}