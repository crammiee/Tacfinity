import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

app.listen(PORT, () => {
  console.log(`api listening on :${PORT}`);
});
