import { useEffect, useState } from 'react';
import { listDrivers, updateDriverVerification } from '../api/admin';
import { Badge, VerificationBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import type { AdminDriver, VehicleType } from '../types';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  MOTO: 'Moto',
  RAKCHA: 'Rakcha',
  CAR: 'Voiture',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

export function DriversPage() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminDriver | null>(null);

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
    setDrivers((prev) => prev.map((d) => (d.id === updated.id ? { ...updated, vehicles: d.vehicles } : d)));
    setDetail((prev) => (prev && prev.id === updated.id ? { ...prev, verificationStatus: updated.verificationStatus } : prev));
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
                <td>
                  <Badge label={driver.onlineStatus ? 'En ligne' : 'Hors ligne'} tone={driver.onlineStatus ? 'positive' : 'neutral'} />
                </td>
                <td>
                  <VerificationBadge status={driver.verificationStatus} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDetail(driver)}>
                      Détails
                    </button>
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

      {detail && (
        <Modal title={`${detail.firstName} ${detail.lastName}`} onClose={() => setDetail(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <div>
              <VerificationBadge status={detail.verificationStatus} />
            </div>

            <div>
              <h3 style={{ marginBottom: 4 }}>Permis de conduire</h3>
              <div>
                <strong>Numéro :</strong> {detail.licenseNumber ?? '—'}
              </div>
              <div>
                <strong>Expiration :</strong> {formatDate(detail.licenseExpiry)}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: 4 }}>Véhicule(s)</h3>
              {detail.vehicles.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>Aucun véhicule enregistré.</p>}
              {detail.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="card" style={{ marginBottom: 8, padding: 12 }}>
                  <div>
                    <strong>Type :</strong> {VEHICLE_LABELS[vehicle.type]}
                  </div>
                  <div>
                    <strong>Marque / modèle :</strong> {vehicle.brand ?? '—'} {vehicle.model ?? ''}
                  </div>
                  <div>
                    <strong>Plaque :</strong> {vehicle.plate ?? '—'}
                  </div>
                  <div>
                    <strong>Couleur :</strong> {vehicle.color ?? '—'}
                  </div>
                  <Badge label={vehicle.isActive ? 'Actif' : 'Inactif'} tone={vehicle.isActive ? 'positive' : 'neutral'} />
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={detail.verificationStatus === 'VERIFIED'}
              onClick={() => setVerification(detail, 'VERIFIED')}
            >
              Valider
            </button>
            <button
              className="btn btn-danger"
              disabled={detail.verificationStatus === 'SUSPENDED'}
              onClick={() => setVerification(detail, 'SUSPENDED')}
            >
              Suspendre
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
