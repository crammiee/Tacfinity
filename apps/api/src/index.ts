import * as http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './features/auth/index.js';
import { errorMiddleware } from './shared/middleware/error.js';
import { logger } from './shared/lib/logger.js';
import { initSockets } from './shared/sockets/index.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

app.use('/api/v1/auth', authRouter);

app.use(errorMiddleware);

// Shared HTTP server for Express + Socket.io
const httpServer = http.createServer(app);
initSockets(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'server listening');
});
