import { Match, Player } from './types';

export function calculateTotalRounds(playerCount: number): number {
  if (playerCount <= 8) return 3;
  if (playerCount <= 16) return 4;
  if (playerCount <= 32) return 5;
  if (playerCount <= 64) return 6;
  if (playerCount <= 128) return 7;
  return Math.ceil(Math.log2(playerCount));
}

// Recalculates stats for all players based on the matches
export function calculateStandings(players: Player[], matches: Match[]): Player[] {
  // Reset stats
  const stats = new Map<string, {
    matchPoints: number,
    gamesWon: number,
    gamesPlayed: number,
    roundsPlayed: number,
    opponents: string[]
  }>();

  for (const p of players) {
    stats.set(p.id, {
      matchPoints: 0,
      gamesWon: 0,
      gamesPlayed: 0,
      roundsPlayed: 0,
      opponents: []
    });
  }

  for (const m of matches) {
    if (!m.completed) continue;

    const pA = stats.get(m.playerA);
    const pB = m.playerB ? stats.get(m.playerB) : null;

    if (pA) {
      pA.gamesWon += m.scoreA;
      pA.gamesPlayed += m.scoreA + m.scoreB;
      pA.roundsPlayed += 1;
      if (m.playerB) pA.opponents.push(m.playerB);
    }
    
    if (pB) {
      pB.gamesWon += m.scoreB;
      pB.gamesPlayed += m.scoreA + m.scoreB;
      pB.roundsPlayed += 1;
      pB.opponents.push(m.playerA);
    }

    if (m.isBye && pA) {
      pA.matchPoints += 3;
    } else if (pA && pB) {
      const aWinsMatch = m.scoreA === 2;
      const bWinsMatch = m.scoreB === 2;
      
      if (aWinsMatch) pA.matchPoints += 3;
      else if (bWinsMatch) pB.matchPoints += 3;
      // else it's a Double Loss (e.g. 1-1, 1-0, etc), 0 points for both
    }
  }

  // Calculate percentages
  const calcMWP = (points: number, rounds: number) => {
    if (rounds === 0) return 0.3333;
    return Math.max(0.3333, points / (rounds * 3));
  };

  const winPctMap = new Map<string, { mwp: number, gwp: number }>();
  
  for (const p of players) {
    const s = stats.get(p.id)!;
    const gwp = s.gamesPlayed === 0 ? 0 : s.gamesWon / s.gamesPlayed;
    winPctMap.set(p.id, {
      mwp: calcMWP(s.matchPoints, s.roundsPlayed),
      gwp
    });
  }

  // Assign stats to players and calculate Opponent averages
  const updatedPlayers = players.map(p => {
    const s = stats.get(p.id)!;
    const wp = winPctMap.get(p.id)!;
    
    let oppMwpSum = 0;
    let oppGwpSum = 0;
    for (const oppId of s.opponents) {
      const oppWp = winPctMap.get(oppId)!;
      oppMwpSum += oppWp.mwp;
      oppGwpSum += oppWp.gwp;
    }

    const oppCount = s.opponents.length || 1; // avoid division by zero

    return {
      ...p,
      matchPoints: s.matchPoints,
      gamesWon: s.gamesWon,
      gamesPlayed: s.gamesPlayed,
      gameWinPct: wp.gwp,
      oppMatchWinPct: s.opponents.length ? oppMwpSum / oppCount : 0.3333,
      oppGameWinPct: s.opponents.length ? oppGwpSum / oppCount : 0,
      opponents: s.opponents
    };
  });

  // Sort by tiebreakers
  // 1. Match Points
  // 2. OMW%
  // 3. GW%
  // 4. OGW%
  return updatedPlayers.sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
    if (b.oppMatchWinPct !== a.oppMatchWinPct) return b.oppMatchWinPct - a.oppMatchWinPct;
    if (b.gameWinPct !== a.gameWinPct) return b.gameWinPct - a.gameWinPct;
    return b.oppGameWinPct - a.oppGameWinPct;
  });
}

// Generate pairings
export function generatePairings(players: Player[], currentRound: number, matches: Match[]): Match[] {
  // Very basic Swiss pairing: pair adjacent players in the standings who haven't played each other
  // Since this is a simple local app, a greedy approach works well enough.
  const standings = calculateStandings(players, matches).filter(p => p.active);
  const paired = new Set<string>();
  const newMatches: Match[] = [];

  for (let i = 0; i < standings.length; i++) {
    const pA = standings[i];
    if (paired.has(pA.id)) continue;

    let pB = null;
    // Find highest ranked opponent they haven't played
    for (let j = i + 1; j < standings.length; j++) {
      const candidate = standings[j];
      if (!paired.has(candidate.id) && !pA.opponents.includes(candidate.id)) {
        pB = candidate;
        break;
      }
    }

    if (pB) {
      paired.add(pA.id);
      paired.add(pB.id);
      newMatches.push({
        id: crypto.randomUUID(),
        round: currentRound,
        playerA: pA.id,
        playerB: pB.id,
        scoreA: 0,
        scoreB: 0,
        isBye: false,
        completed: false
      });
    }
  }

  // Only the last unpaired player (lowest ranked) gets a bye if odd number of players
  const unpaired = standings.filter(p => !paired.has(p.id));
  if (unpaired.length === 1) {
    const player = unpaired[0];
    newMatches.push({
      id: crypto.randomUUID(),
      round: currentRound,
      playerA: player.id,
      playerB: null,
      scoreA: 2,
      scoreB: 0,
      isBye: true,
      completed: true // Byes are automatically completed
    });
  }

  return newMatches;
}