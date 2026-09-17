import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import driverRoutes from './routes/driver.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/driver', driverRoutes);

app.listen(PORT, () => {
  console.log(`TaxiDja backend listening on port ${PORT}`);
});
