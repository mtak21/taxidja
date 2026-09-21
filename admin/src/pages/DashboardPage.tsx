import { useEffect, useState } from 'react';
import { getStats } from '../api/admin';
import { StatCard } from '../components/StatCard';
import type { Stats } from '../types';

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      {stats && (
        <div className="stat-grid">
          <StatCard label="Utilisateurs" value={stats.totalUsers} />
          <StatCard label="Conducteurs" value={stats.totalDrivers} />
          <StatCard label="Conducteurs en ligne" value={stats.onlineDrivers} />
          <StatCard label="Véhicules" value={stats.totalVehicles} />
          <StatCard label="Courses aujourd'hui" value={stats.ridesToday} />
          <StatCard label="Courses terminées" value={stats.completedRides} />
          <StatCard label="Courses annulées" value={stats.cancelledRides} />
          <StatCard label="Revenus totaux" value={`${stats.totalRevenue} FCFA`} />
        </div>
      )}
    </div>
  );
}
