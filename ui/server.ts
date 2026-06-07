import express, { Request, Response } from 'express';
import { execFile } from 'child_process';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let currentModel = 'claude-sonnet-4-6';

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/api/model', (_req: Request, res: Response) => {
  res.json({ model: currentModel });
});

interface SetModelBody {
  model?: string;
}

interface RunBody {
  prompt?: string;
}

app.post('/api/set-model', (req: Request, res: Response) => {
  const { model } = req.body as SetModelBody;
  if (!model) {
    return res.status(400).json({ error: 'model is required' });
  }
  currentModel = model;
  return res.json({ success: true });
});
app.post('/api/run', async (req: Request, res: Response) => {
  const { prompt } = req.body as RunBody;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  try {
    const output = await new Promise<string>((resolve, reject) => {
      execFile('claude', ['-p', prompt, '--model', currentModel], (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve(stdout);
      });
    });
    return res.json({ result: output });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'unknown' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
