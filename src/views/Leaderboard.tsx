import { Player } from '../types';

export function Leaderboard({ players, compact = false }: { players: Player[], compact?: boolean }) {
  return (
    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-left border-collapse bg-white">
        <thead>
          <tr class="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold">
            <th class="p-3">#</th>
            <th class="p-3">Name</th>
            <th class="p-3 text-right">Pts</th>
            {!compact && <th class="p-3 text-right">OMW%</th>}
            {!compact && <th class="p-3 text-right">GW%</th>}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-sm">
          {players.map((p, i) => (
            <tr key={p.id} class="hover:bg-indigo-50 transition-colors">
              <td class="p-3 font-bold text-gray-400">{i + 1}</td>
              <td class="p-3 font-medium text-gray-800">{p.name}</td>
              <td class="p-3 text-right font-black text-indigo-600">{p.matchPoints}</td>
              {!compact && <td class="p-3 text-right text-gray-600">{(p.oppMatchWinPct * 100).toFixed(2)}%</td>}
              {!compact && <td class="p-3 text-right text-gray-600">{(p.gameWinPct * 100).toFixed(2)}%</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}