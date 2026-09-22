import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import driverRoutes from './routes/driver.routes';
import rideRoutes from './routes/ride.routes';
import adminRoutes from './routes/admin.routes';
import usersRoutes from './routes/users.routes';
import { initSocket } from './socket';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS only affects browser clients (it's a browser-enforced restriction, not
// something a native app's HTTP client checks) — permissive here for the web
// admin dashboard during dev. Explicit rather than relying on the cors()
// default, which is equally permissive but easy to second-guess later.
app.use(cors({ origin: true }));
// Default helmet CORP ("same-origin") would block the admin dashboard (a
// different origin/port) from loading avatar images — the mobile app isn't
// affected either way since RN's image loading doesn't go through a
// browser's CORP enforcement.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/driver', driverRoutes);
app.use('/rides', rideRoutes);
app.use('/admin', adminRoutes);
app.use('/users', usersRoutes);

const httpServer = http.createServer(app);
initSocket(httpServer);

const HOST = '0.0.0.0';

httpServer.listen(Number(PORT), HOST, () => {
  console.log(`TaxiDja backend listening on ${HOST}:${PORT}`);
});
