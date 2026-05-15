import { isLoading } from './store';
import { SetupView } from './views/SetupView';
import { DashboardView } from './views/DashboardView';
import { LoadView } from './views/LoadView';
import { signal } from '@preact/signals';

export const currentView = signal<'load' | 'setup' | 'dashboard'>('load');

export function App() {
  if (isLoading.value) return <div class="p-8 text-center">Loading...</div>;

  return (
    <div class="min-h-screen flex flex-col bg-gray-100">
      <header class="bg-indigo-700 text-white p-4 shadow-lg flex justify-between items-center z-10 relative">
        <h1 class="text-2xl font-black tracking-tight">TATSU <span class="font-light">YGO</span></h1>
        <nav class="space-x-2 md:space-x-6">
          <button 
            onClick={() => currentView.value = 'load'} 
            class={`uppercase text-sm font-bold tracking-wider px-3 py-2 rounded transition-colors ${currentView.value === 'load' ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}
          >
            Load
          </button>
          <button 
            onClick={() => currentView.value = 'setup'} 
            class={`uppercase text-sm font-bold tracking-wider px-3 py-2 rounded transition-colors ${currentView.value === 'setup' ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}
          >
            New Setup
          </button>
        </nav>
      </header>

      <main class="flex-grow p-4 md:p-8 w-full max-w-5xl mx-auto">
        {currentView.value === 'load' && <LoadView />}
        {currentView.value === 'setup' && <SetupView />}
        {currentView.value === 'dashboard' && <DashboardView />}
      </main>
    </div>
  );
}