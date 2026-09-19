import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import driverRoutes from './routes/driver.routes';
import rideRoutes from './routes/ride.routes';
import { initSocket } from './socket';

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
app.use('/rides', rideRoutes);

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`TaxiDja backend listening on port ${PORT}`);
});
