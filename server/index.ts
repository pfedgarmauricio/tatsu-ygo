import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend assets from the Vite build output
app.use(express.static(distDir));

const dataDir = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory', err);
  }
}

app.get('/api/tournaments', async (_req, res) => {
  await ensureDataDir();
  try {
    const files = await fs.readdir(dataDir);
    const tournaments = files.filter(f => f.startsWith('tatsu-ygo-') && f.endsWith('.json'));
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data directory' });
  }
});

app.get('/api/tournaments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const filePath = path.join(dataDir, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(404).json({ error: 'Tournament not found' });
  }
});

app.post('/api/tournaments/:id', async (req, res) => {
  await ensureDataDir();
  const { id } = req.params;
  try {
    const filePath = path.join(dataDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save tournament' });
  }
});

// SPA fallback: serve index.html for any route not matched by the API
// This enables client-side routing via React Router
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
