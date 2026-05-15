import { useEffect, useState } from 'preact/hooks';
import { fetchTournaments, loadTournament } from '../store';
import { currentView } from '../App';

export function LoadView() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments().then(res => {
      setFiles(res);
      setLoading(false);
    });
  }, []);

  const handleLoad = async (filename: string) => {
    const id = filename.replace('.json', '');
    await loadTournament(id);
    currentView.value = 'dashboard';
  };

  return (
    <div class="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto mt-8">
      <h2 class="text-3xl font-bold mb-6 text-gray-800">Load Tournament</h2>
      {loading ? (
        <p class="text-gray-500 italic">Loading files...</p>
      ) : files.length === 0 ? (
        <p class="text-gray-500 italic">No saved tournaments found.</p>
      ) : (
        <ul class="space-y-3">
          {files.map(f => (
            <li key={f} class="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <span class="font-mono text-gray-700">{f}</span>
              <button 
                onClick={() => handleLoad(f)}
                class="bg-indigo-600 text-white px-5 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Load
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}