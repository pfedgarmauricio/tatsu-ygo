import { useState } from 'preact/hooks';
import { createTournament } from '../store';
import { Format } from '../types';
import { currentView } from '../App';
import { calculateTotalRounds } from '../logic';

export function SetupView() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState<Format>('Advanced');
  const [playerInput, setPlayerInput] = useState('');
  const [players, setPlayers] = useState<string[]>([]);

  const handleAddPlayer = () => {
    if (playerInput.trim()) {
      // Split by comma
      const newNames = playerInput.split(',').map(s => s.trim()).filter(Boolean);
      setPlayers([...players, ...newNames]);
      setPlayerInput('');
    }
  };

  const handleRemove = (idx: number) => {
    setPlayers(players.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    await createTournament(date, format, players);
    currentView.value = 'dashboard';
  };

  const totalRounds = calculateTotalRounds(players.length);

  return (
    <div class="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto mt-4">
      <h2 class="text-3xl font-bold mb-8 text-gray-800">New Tournament Setup</h2>
      
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Date</label>
          <input 
            type="date" 
            value={date} 
            onInput={e => setDate((e.target as HTMLInputElement).value)}
            class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Format</label>
          <select 
            value={format} 
            onChange={e => setFormat((e.target as HTMLSelectElement).value as Format)}
            class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white"
          >
            <option>Advanced</option>
            <option>Genesys 100</option>
            <option>Edison</option>
            <option>Mas Odiados</option>
            <option>Tag</option>
          </select>
        </div>
      </div>

      <div class="mb-8">
        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Add Players (Comma separated or single)</label>
        <div class="flex gap-3">
          <input 
            type="text" 
            value={playerInput} 
            onInput={e => setPlayerInput((e.target as HTMLInputElement).value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
            class="flex-grow border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
            placeholder="e.g. Yugi, Kaiba, Joey"
          />
          <button onClick={handleAddPlayer} class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm shadow hover:bg-indigo-700 transition-colors">Add</button>
        </div>
      </div>

      <div class="mb-8">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-gray-800">Player List ({players.length})</h3>
          <span class="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Calculated Rounds: {totalRounds}</span>
        </div>
        <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 shadow-inner">
          {players.length === 0 ? <p class="text-gray-400 text-sm italic text-center py-4">No players added.</p> : null}
          <ul class="space-y-2">
            {players.map((p, i) => (
              <li key={i} class="flex justify-between items-center bg-white p-3 rounded-md shadow-sm border border-gray-100 text-sm">
                <span class="font-medium text-gray-700">{p}</span>
                <button onClick={() => handleRemove(i)} class="text-red-500 hover:text-red-700 font-bold uppercase text-xs tracking-wider">Remove</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button 
        onClick={handleCreate}
        disabled={players.length < 4}
        class="w-full bg-green-600 text-white font-bold py-4 rounded-lg uppercase tracking-wider shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Initialize Tournament
      </button>
      {players.length < 4 && <p class="text-red-500 text-sm mt-3 text-center font-medium">Minimum 4 players required.</p>}
    </div>
  );
}