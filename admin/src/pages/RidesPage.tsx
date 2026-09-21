import { useEffect, useState } from 'react';
import { getRideDetail, listRides } from '../api/admin';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { RideStatusBadge } from '../components/Badge';
import type { AdminRideDetail, AdminRideListItem, RideStatus, VehicleType } from '../types';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  MOTO: 'Moto',
  RAKCHA: 'Rakcha',
  CAR: 'Voiture',
};

const STATUS_OPTIONS: RideStatus[] = [
  'REQUESTED',
  'SEARCHING',
  'ACCEPTED',
  'DRIVER_ARRIVING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR');
}

export function RidesPage() {
  const [rides, setRides] = useState<AdminRideListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RideStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminRideDetail | null>(null);

  function load(targetPage: number) {
    setLoading(true);
    listRides({ page: targetPage, search: search || undefined, status: status || undefined })
      .then((data) => {
        setRides(data.rides);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setPage(targetPage);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  async function openDetail(ride: AdminRideListItem) {
    const full = await getRideDetail(ride.id);
    setDetail(full);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Rechercher (adresse, passager)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as RideStatus | '')}>
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Passager</th>
              <th>Conducteur</th>
              <th>Véhicule</th>
              <th>Prix</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(ride)}>
                <td>{formatDate(ride.requestedAt)}</td>
                <td>
                  {ride.passenger.firstName} {ride.passenger.lastName}
                </td>
                <td>{ride.driver ? `${ride.driver.firstName} ${ride.driver.lastName}` : '—'}</td>
                <td>{VEHICLE_LABELS[ride.vehicleType]}</td>
                <td>{ride.finalPrice ?? ride.estimatedPrice} FCFA</td>
                <td>
                  <RideStatusBadge status={ride.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rides.length === 0 && <div className="empty-state">Aucune course trouvée.</div>}
      </div>

      <Pagination page={page} total={total} pageSize={pageSize} onChange={load} />

      {detail && (
        <Modal title="Détail de la course" onClose={() => setDetail(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <div>
              <RideStatusBadge status={detail.status} />
            </div>
            <div>
              <strong>Passager :</strong> {detail.passenger.firstName} {detail.passenger.lastName} ({detail.passenger.phone})
            </div>
            <div>
              <strong>Conducteur :</strong>{' '}
              {detail.driver ? `${detail.driver.firstName} ${detail.driver.lastName} (${detail.driver.phone})` : '—'}
            </div>
            <div>
              <strong>Départ :</strong> {detail.pickupAddress ?? `${detail.pickupLatitude}, ${detail.pickupLongitude}`}
            </div>
            <div>
              <strong>Destination :</strong>{' '}
              {detail.destinationAddress ?? `${detail.destinationLatitude}, ${detail.destinationLongitude}`}
            </div>
            <div>
              <strong>Distance :</strong> {detail.distance} km · {detail.estimatedDuration} min
            </div>
            <div>
              <strong>Prix :</strong> {detail.finalPrice ?? detail.estimatedPrice} FCFA
              {detail.finalPrice === null && ' (estimé)'}
            </div>
            <div>
              <strong>Demandée le :</strong> {formatDate(detail.requestedAt)}
            </div>
            {detail.completedAt && (
              <div>
                <strong>Terminée le :</strong> {formatDate(detail.completedAt)}
              </div>
            )}
            {detail.cancelledAt && (
              <div>
                <strong>Annulée le :</strong> {formatDate(detail.cancelledAt)}
              </div>
            )}
            {detail.rating && (
              <div>
                <strong>Note :</strong> {detail.rating.score} / 5{detail.rating.comment ? ` — "${detail.rating.comment}"` : ''}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setDetail(null)}>
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
