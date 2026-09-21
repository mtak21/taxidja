import { useEffect, useState } from 'react';
import { listDrivers, updateDriverVerification } from '../api/admin';
import { Badge, VerificationBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import type { AdminDriver } from '../types';

export function DriversPage() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load(targetPage: number) {
    setLoading(true);
    listDrivers({ page: targetPage, search: search || undefined })
      .then((data) => {
        setDrivers(data.drivers);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setPage(targetPage);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function setVerification(driver: AdminDriver, status: 'VERIFIED' | 'SUSPENDED') {
    const updated = await updateDriverVerification(driver.id, status);
    setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Conducteurs</h1>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Rechercher (nom, téléphone)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Note</th>
              <th>Courses</th>
              <th>Véhicules</th>
              <th>En ligne</th>
              <th>Vérification</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id}>
                <td>
                  {driver.firstName} {driver.lastName}
                </td>
                <td>{driver.phone}</td>
                <td>{driver.rating.toFixed(1)} / 5</td>
                <td>{driver.totalTrips}</td>
                <td>{driver.vehicleCount}</td>
                <td>
                  <Badge label={driver.onlineStatus ? 'En ligne' : 'Hors ligne'} tone={driver.onlineStatus ? 'positive' : 'neutral'} />
                </td>
                <td>
                  <VerificationBadge status={driver.verificationStatus} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={driver.verificationStatus === 'VERIFIED'}
                      onClick={() => setVerification(driver, 'VERIFIED')}
                    >
                      Valider
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={driver.verificationStatus === 'SUSPENDED'}
                      onClick={() => setVerification(driver, 'SUSPENDED')}
                    >
                      Suspendre
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && drivers.length === 0 && <div className="empty-state">Aucun conducteur trouvé.</div>}
      </div>

      <Pagination page={page} total={total} pageSize={pageSize} onChange={load} />
    </div>
  );
}
