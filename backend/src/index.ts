import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PgSession = connectPgSimple(session);
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: new PgSession({ pool: pgPool, tableName: 'user_sessions' }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import attemptRoutes from './routes/attempt.routes';
import writingRoutes from './routes/writing.routes';
import adminRoutes from './routes/admin.routes';

app.use('/api/auth', authRoutes);
app.use('/api', bookRoutes);
app.use('/api', attemptRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Backend running on port ' + PORT));

export default app;
