import { calculateTotalRounds, calculateStandings, generatePairings } from './logic';
import { Player, Match } from './types';

// Utility functions for testing
function createTestPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    active: true,
    matchPoints: 0,
    gamesWon: 0,
    gamesPlayed: 0,
    gameWinPct: 0,
    oppMatchWinPct: 0,
    oppGameWinPct: 0,
    opponents: []
  };
}

function generateRandomResult(): { scoreA: number; scoreB: number } {
  const outcomes = [
    { scoreA: 2, scoreB: 0 },
    { scoreA: 2, scoreB: 1 },
    { scoreA: 1, scoreB: 2 },
    { scoreA: 0, scoreB: 2 }
  ];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function simulateTournament(
  playerCount: number,
  testName: string
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // Create players
  const players = Array.from({ length: playerCount }, (_, i) =>
    createTestPlayer(`player-${i}`, `Player ${i + 1}`)
  );

  const totalRounds = calculateTotalRounds(playerCount);
  let matches: Match[] = [];

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 ${testName}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Players: ${playerCount}, Total Rounds: ${totalRounds}, Bye eligible: ${playerCount % 2 === 1 ? 'Yes (odd)' : 'No (even)'}`);

  // Simulate each round
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = generatePairings(players, round, matches);
    
    console.log(`\n📋 Round ${round}: Generated ${roundMatches.length} matches`);

    // Check bye rule: only 1 bye max, and only if odd players
    const byes = roundMatches.filter(m => m.isBye);
    if (byes.length > 1) {
      errors.push(`Round ${round}: Multiple byes found (${byes.length})`);
    }
    if (byes.length > 0 && playerCount % 2 === 0) {
      errors.push(`Round ${round}: Bye found with even number of players`);
    }

    // If odd players, exactly one bye should exist
    if (playerCount % 2 === 1 && byes.length !== 1) {
      errors.push(`Round ${round}: Expected 1 bye for odd players, got ${byes.length}`);
    }

    // Complete matches with random results
    for (const match of roundMatches) {
      if (!match.isBye) {
        const result = generateRandomResult();
        match.scoreA = result.scoreA;
        match.scoreB = result.scoreB;
      }
      match.completed = true;
      matches.push(match);
    }
  }

  // Validate no duplicate pairings
  console.log(`\n🔍 Validating pairings...`);
  const pairingMap = new Map<string, Set<string>>();

  for (const match of matches) {
    if (match.isBye) continue;

    const pairKey = [match.playerA, match.playerB].sort().join('-');
    if (!pairingMap.has(match.playerA)) {
      pairingMap.set(match.playerA, new Set());
    }

    const opponents = pairingMap.get(match.playerA)!;
    if (opponents.has(match.playerB!)) {
      errors.push(`Duplicate pairing: ${match.playerA} vs ${match.playerB} in rounds ${matches.filter(m => m.playerA === match.playerA && m.playerB === match.playerB)[0].round} and ${match.round}`);
    }
    opponents.add(match.playerB!);

    if (!pairingMap.has(match.playerB!)) {
      pairingMap.set(match.playerB!, new Set());
    }
    pairingMap.get(match.playerB!)!.add(match.playerA);
  }

  // Calculate final standings
  const standings = calculateStandings(players, matches);

  console.log(`\n🏆 Final Standings:`);
  console.log('Rank      Name                 Points   GW%      OMW%     OGW%');
  console.log('-'.repeat(70));

  standings.forEach((player, idx) => {
    const rank = String(idx + 1).padEnd(6);
    const name = player.name.substring(0, 20).padEnd(20);
    const points = String(player.matchPoints).padEnd(8);
    const gwp = ((player.gameWinPct * 100).toFixed(1) + '%').padEnd(8);
    const omwp = ((player.oppMatchWinPct * 100).toFixed(1) + '%').padEnd(8);
    const ogwp = ((player.oppGameWinPct * 100).toFixed(1) + '%').padEnd(8);
    console.log(`${rank}${name}${points}${gwp}${omwp}${ogwp}`);
  });

  // Report bye recipients
  const byeRecipients = matches
    .filter(m => m.isBye)
    .map(m => {
      const playerIdx = players.findIndex(p => p.id === m.playerA);
      return { name: players[playerIdx].name, round: m.round };
    });

  if (byeRecipients.length > 0) {
    console.log(`\n🎯 Bye Recipients:`);
    byeRecipients.forEach(bye => {
      console.log(`  - ${bye.name} (Round ${bye.round})`);
    });
  }

  // Final verdict
  const passed = errors.length === 0;
  if (passed) {
    console.log(`\n✅ All validations passed!`);
  } else {
    console.log(`\n❌ Validation errors found:`);
    errors.forEach(err => console.log(`  - ${err}`));
  }

  return { passed, errors };
}

// Run tests
console.log('\n🚀 Starting Pairing Algorithm Tests\n');

const results = [
  simulateTournament(102, 'Test 1: Even number of players (102)'),
  simulateTournament(115, 'Test 2: Odd number of players (115)'),
  simulateTournament(2577, 'Test 3: Large tournament - odd number (2577)')
];

// Summary
console.log(`\n${'='.repeat(80)}`);
console.log('📊 Test Summary');
console.log(`${'='.repeat(80)}`);
results.forEach((result, idx) => {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  console.log(`Test ${idx + 1}: ${status}`);
});

const allPassed = results.every(r => r.passed);
console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
process.exit(allPassed ? 0 : 1);
