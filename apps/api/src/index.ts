import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRouter } from './features/auth/index.js';
import { errorMiddleware } from './shared/middleware/error.js';
import { logger } from './shared/lib/logger.js';

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

app.listen(env.PORT, () => {
  logger.info(`api listening on :${env.PORT}`);
});
