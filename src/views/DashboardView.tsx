import { useState, useEffect } from 'preact/hooks';
import { tournamentState, startRound, endRound, updateMatchScore, addLatePlayer, saveTournament } from '../store';
import { Leaderboard } from './Leaderboard';

export function DashboardView() {
  const state = tournamentState.value;

  if (!state) {
    return <div>No active tournament</div>;
  }

  if (state.isFinished) {
    return (
      <div class="bg-white p-8 rounded-xl shadow-md max-w-4xl mx-auto mt-8">
        <h2 class="text-4xl font-bold mb-6 text-center text-green-600">Tournament Finished!</h2>
        <Leaderboard players={state.players} />
      </div>
    );
  }

  return (
    <div class="space-y-6 max-w-5xl mx-auto mt-4">
      <div class="bg-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Round {state.currentRound} of {state.totalRounds}</h2>
          <p class="text-sm font-medium text-indigo-600 uppercase tracking-wider">{state.format} Format</p>
        </div>
        
        {!state.isStarted ? (
          <button 
            onClick={startRound}
            class="bg-indigo-600 text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider shadow hover:bg-indigo-700 transition-colors animate-pulse"
          >
            Start Round {state.currentRound} Timer
          </button>
        ) : (
          <>
            <Timer />
            <EndRoundButton />
          </>
        )}
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-6">
          <PairingsList />
          {state.currentRound === 1 && <LateEntryForm />}
        </div>
        <div>
          <div class="bg-white p-6 rounded-xl shadow-md h-full">
            <h3 class="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Live Standings</h3>
            <Leaderboard players={state.players} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

function Timer() {
  const state = tournamentState.value!;
  const [timeLeft, setTimeLeft] = useState(state.timerDuration);

  useEffect(() => {
    if (!state.timerStartedAt) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.timerStartedAt!) / 1000);
      setTimeLeft(Math.max(0, state.timerDuration - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.timerStartedAt, state.timerDuration]);

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  
  const color = timeLeft === 0 ? 'text-red-600' : 'text-gray-800';

  const addTime = (mins: number) => {
    const newState = { ...state, timerDuration: state.timerDuration + mins * 60 };
    tournamentState.value = newState;
    saveTournament(newState);
  };

  return (
    <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
      <div class={`text-4xl font-black font-mono tracking-widest ${color}`}>{m}:{s}</div>
      <div class="flex flex-col gap-2">
        <button onClick={() => addTime(5)} class="text-xs font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 px-3 py-1 rounded shadow-sm transition-colors">+5m</button>
        <button onClick={() => addTime(-5)} disabled={state.timerDuration <= 300} class="text-xs font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 px-3 py-1 rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">-5m</button>
      </div>
    </div>
  );
}

function EndRoundButton() {
  const state = tournamentState.value!;
  const currentMatches = state.matches.filter(m => m.round === state.currentRound);
  const allCompleted = currentMatches.every(m => m.completed);

  return (
    <button 
      onClick={endRound}
      disabled={!allCompleted}
      class={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all shadow-sm ${
        allCompleted ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
      }`}
    >
      {allCompleted ? 'End Round' : 'Waiting for Matches'}
    </button>
  );
}

function PairingsList() {
  const state = tournamentState.value!;
  const currentMatches = state.matches.filter(m => m.round === state.currentRound);

  return (
    <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <h3 class="font-bold text-lg p-4 bg-gray-50 border-b text-gray-800">Pairings</h3>
      <ul class="divide-y divide-gray-100">
        {currentMatches.map((m, i) => (
          <MatchRow key={m.id} match={m} table={i + 1} />
        ))}
      </ul>
    </div>
  );
}

function MatchRow({ match, table }: { match: any, table: number }) {
  const state = tournamentState.value!;
  const pA = state.players.find(p => p.id === match.playerA);
  const pB = match.playerB ? state.players.find(p => p.id === match.playerB) : null;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <li 
        class={`p-4 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors ${match.completed ? 'opacity-60 bg-gray-50' : ''}`}
        onClick={() => !match.isBye && setModalOpen(true)}
      >
        <span class="w-8 font-bold text-gray-400">T{table}</span>
        <div class="flex-grow flex justify-between px-4">
          <span class={`font-medium ${match.scoreA === 2 ? 'text-green-600 font-bold' : 'text-gray-800'}`}>{pA?.name}</span>
          <span class="text-xs font-mono font-bold bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
            {match.completed ? `${match.scoreA} - ${match.scoreB}` : 'VS'}
          </span>
          <span class={`font-medium ${match.scoreB === 2 ? 'text-green-600 font-bold' : 'text-gray-800'}`}>{pB?.name || 'BYE'}</span>
        </div>
        <span class="text-xs font-bold uppercase tracking-wider w-16 text-right">
          {match.completed ? <span class="text-green-600">Done</span> : <span class="text-amber-500">Pending</span>}
        </span>
      </li>
      {modalOpen && pB && (
        <ScoreModal 
          match={match} 
          pA={pA!} 
          pB={pB} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </>
  );
}

function ScoreModal({ match, pA, pB, onClose }: { match: any, pA: any, pB: any, onClose: () => void }) {
  const [scoreA, setScoreA] = useState(match.scoreA || 0);
  const [scoreB, setScoreB] = useState(match.scoreB || 0);

  const handleSubmit = () => {
    updateMatchScore(match.id, scoreA, scoreB);
    onClose();
  };

  let resultText = 'Double Loss';
  if (scoreA === 2 && scoreB < 2) resultText = `${pA.name} Wins Match`;
  else if (scoreB === 2 && scoreA < 2) resultText = `${pB.name} Wins Match`;
  else if (scoreA === 2 && scoreB === 2) resultText = 'Invalid Score (Both 2)';

  return (
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <h3 class="text-2xl font-bold mb-6 border-b pb-4 text-gray-800">Report Score</h3>
        
        <div class="flex justify-between items-center mb-8">
          <div class="text-center w-2/5">
            <label class="block font-bold text-gray-700 mb-3 truncate" title={pA.name}>{pA.name}</label>
            <input 
              type="number" min="0" max="2" 
              value={scoreA} 
              onInput={e => setScoreA(parseInt((e.target as HTMLInputElement).value) || 0)}
              class="w-full text-center text-3xl font-black border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 p-3 rounded-xl outline-none transition-colors"
            />
          </div>
          <span class="text-3xl font-light text-gray-300">-</span>
          <div class="text-center w-2/5">
            <label class="block font-bold text-gray-700 mb-3 truncate" title={pB.name}>{pB.name}</label>
            <input 
              type="number" min="0" max="2" 
              value={scoreB} 
              onInput={e => setScoreB(parseInt((e.target as HTMLInputElement).value) || 0)}
              class="w-full text-center text-3xl font-black border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 p-3 rounded-xl outline-none transition-colors"
            />
          </div>
        </div>

        <div class="bg-indigo-50 text-indigo-800 p-4 rounded-lg mb-8 text-center font-bold text-lg shadow-inner">
          Result: {resultText}
        </div>

        <div class="flex gap-4">
          <button onClick={onClose} class="flex-1 bg-gray-100 text-gray-600 font-bold uppercase tracking-wider text-sm py-3 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={scoreA === 2 && scoreB === 2}
            class="flex-1 bg-indigo-600 text-white font-bold uppercase tracking-wider text-sm py-3 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function LateEntryForm() {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      addLatePlayer(name.trim());
      setName('');
    }
  };

  return (
    <div class="bg-orange-50 rounded-xl shadow-md p-6 border border-orange-100">
      <h3 class="font-bold text-orange-800 mb-1 text-lg">Late Entry</h3>
      <p class="text-sm text-orange-600 mb-4">Player will receive an automatic Round 1 Match Loss.</p>
      <div class="flex gap-3">
        <input 
          type="text" 
          value={name} 
          onInput={e => setName((e.target as HTMLInputElement).value)}
          placeholder="Player Name" 
          class="flex-grow border border-orange-200 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm"
        />
        <button onClick={handleAdd} class="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 shadow hover:shadow-md font-bold uppercase tracking-wider text-sm transition-all">Add</button>
      </div>
    </div>
  );
}