import { signal } from '@preact/signals';
import { TournamentState, Player, Match, Format } from './types';
import { calculateStandings, generatePairings, calculateTotalRounds } from './logic';

export const tournamentState = signal<TournamentState | null>(null);
export const isLoading = signal<boolean>(false);

const API_URL = '/api/tournaments';

export async function fetchTournaments() {
  const res = await fetch(API_URL);
  return res.json();
}

export async function loadTournament(id: string) {
  isLoading.value = true;
  const res = await fetch(`${API_URL}/${id}`);
  if (res.ok) {
    const data = await res.json();
    tournamentState.value = data;
  }
  isLoading.value = false;
}

export async function saveTournament(state: TournamentState) {
  await fetch(`${API_URL}/${state.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
}

export async function createTournament(date: string, format: Format, playerNames: string[]) {
  const existingFiles = await fetchTournaments();
  const todayFiles = existingFiles.filter((f: string) => f.startsWith(`tatsu-ygo-${date}`));
  const count = todayFiles.length + 1;
  const id = `tatsu-ygo-${date}-${count}`;

  const players: Player[] = playerNames.map(name => ({
    id: crypto.randomUUID(),
    name,
    active: true,
    matchPoints: 0,
    gamesWon: 0,
    gamesPlayed: 0,
    gameWinPct: 0,
    oppMatchWinPct: 0.3333,
    oppGameWinPct: 0,
    opponents: []
  }));

  const totalRounds = calculateTotalRounds(players.length);
  
  // Generate round 1 pairings immediately
  const initialMatches = generatePairings(players, 1, []);

  const newState: TournamentState = {
    id,
    date,
    format,
    players,
    matches: initialMatches,
    currentRound: 1,
    totalRounds,
    isStarted: false,
    isFinished: false,
    timerDuration: 50 * 60, // 50 mins in seconds
    timerStartedAt: null
  };

  tournamentState.value = newState;
  saveTournament(newState);
}

export function startRound() {
  const state = tournamentState.value;
  if (!state) return;
  
  const newState = {
    ...state,
    isStarted: true,
    timerStartedAt: Date.now()
  };
  
  tournamentState.value = newState;
  saveTournament(newState);
}

export function addLatePlayer(name: string) {
  const state = tournamentState.value;
  if (!state || state.currentRound > 1 || state.isFinished) return;

  const newPlayer: Player = {
    id: crypto.randomUUID(),
    name,
    active: true,
    matchPoints: 0,
    gamesWon: 0,
    gamesPlayed: 0,
    gameWinPct: 0,
    oppMatchWinPct: 0.3333,
    oppGameWinPct: 0,
    opponents: []
  };

  // Provide a round 1 Match Loss
  const lateMatch: Match = {
    id: crypto.randomUUID(),
    round: 1,
    playerA: newPlayer.id,
    playerB: null, // essentially a bye loss? Wait, a bye is a win.
    // To give a match loss, we can just record a dummy match that gives 0-2 loss, or we just leave them with 0 points.
    // If we leave them with 0 points, they didn't play a round. 
    // To affect tiebreakers properly, we can create a dummy match where they lost 0-2 to "Late Entry Penalty".
    scoreA: 0,
    scoreB: 2,
    isBye: false,
    completed: true
  };

  const newPlayers = [...state.players, newPlayer];
  const newTotalRounds = calculateTotalRounds(newPlayers.length);

  const newState = {
    ...state,
    players: newPlayers,
    matches: [...state.matches, lateMatch],
    totalRounds: Math.max(state.totalRounds, newTotalRounds)
  };

  tournamentState.value = newState;
  saveTournament(newState);
}

export function updateMatchScore(matchId: string, scoreA: number, scoreB: number) {
  const state = tournamentState.value;
  if (!state) return;

  const newMatches = state.matches.map(m => {
    if (m.id === matchId) {
      return { ...m, scoreA, scoreB, completed: true };
    }
    return m;
  });

  const newState = { ...state, matches: newMatches };
  // Recalculate standings strictly for display? No, just keep them in state.
  tournamentState.value = newState;
  saveTournament(newState);
}

export function endRound() {
  const state = tournamentState.value;
  if (!state) return;

  // Check if all matches completed
  const roundMatches = state.matches.filter(m => m.round === state.currentRound);
  if (!roundMatches.every(m => m.completed)) return;

  const updatedPlayers = calculateStandings(state.players, state.matches);

  if (state.currentRound >= state.totalRounds) {
    // End tournament
    const newState = { ...state, players: updatedPlayers, isFinished: true };
    tournamentState.value = newState;
    saveTournament(newState);
  } else {
    // Next round standby - generate pairings immediately but don't start timer
    const nextRound = state.currentRound + 1;
    const nextMatches = generatePairings(updatedPlayers, nextRound, state.matches);
    
    const newState = { 
      ...state, 
      players: updatedPlayers,
      matches: [...state.matches, ...nextMatches],
      currentRound: nextRound, 
      isStarted: false, // reset to false so the round must be manually started
      timerStartedAt: null
    };
    tournamentState.value = newState;
    saveTournament(newState);
  }
}
