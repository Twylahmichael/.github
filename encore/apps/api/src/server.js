import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { membersRouter } from './routes/members.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: (process.env.ENCORE_ALLOWED_ORIGINS || 'https://efn.co.ke').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api', publicRouter);
app.use('/api/members', membersRouter);
app.use('/api/admin', adminRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'internal error' });
});

app.listen(PORT, () => {
  console.log(`Encore API listening on :${PORT}`);
  console.log(`DB rows — coaches: ${db.prepare('SELECT COUNT(*) AS n FROM coaches').get().n}`);
});
