import { useEffect, useState } from 'react';
import { listUsers, updateUserStatus } from '../api/admin';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import type { AdminUser, UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  PASSENGER: 'Passager',
  DRIVER: 'Conducteur',
  ADMIN: 'Admin',
};

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(true);

  function load(targetPage: number) {
    setLoading(true);
    listUsers({ page: targetPage, search: search || undefined, role: role || undefined })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setPage(targetPage);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role]);

  async function toggleActive(user: AdminUser) {
    const updated = await updateUserStatus(user.id, !user.isActive);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Utilisateurs</h1>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Rechercher (nom, téléphone, email)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole | '')}>
          <option value="">Tous les rôles</option>
          <option value="PASSENGER">Passager</option>
          <option value="DRIVER">Conducteur</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.phone}</td>
                <td>{user.email ?? '—'}</td>
                <td>{ROLE_LABELS[user.role]}</td>
                <td>
                  <Badge label={user.isActive ? 'Actif' : 'Désactivé'} tone={user.isActive ? 'positive' : 'negative'} />
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(user)}>
                    {user.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && <div className="empty-state">Aucun utilisateur trouvé.</div>}
      </div>

      <Pagination page={page} total={total} pageSize={pageSize} onChange={load} />
    </div>
  );
}
