type Tone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info';

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

const RIDE_STATUS_BADGE: Record<string, { label: string; tone: Tone }> = {
  REQUESTED: { label: 'En attente', tone: 'neutral' },
  SEARCHING: { label: 'Recherche', tone: 'neutral' },
  ACCEPTED: { label: 'Acceptée', tone: 'info' },
  DRIVER_ARRIVING: { label: 'Conducteur en route', tone: 'info' },
  IN_PROGRESS: { label: 'En cours', tone: 'warning' },
  COMPLETED: { label: 'Terminée', tone: 'positive' },
  CANCELLED: { label: 'Annulée', tone: 'negative' },
};

export function RideStatusBadge({ status }: { status: string }) {
  const entry = RIDE_STATUS_BADGE[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Badge label={entry.label} tone={entry.tone} />;
}

const VERIFICATION_BADGE: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'En attente', tone: 'neutral' },
  VERIFIED: { label: 'Vérifié', tone: 'positive' },
  SUSPENDED: { label: 'Suspendu', tone: 'negative' },
};

export function VerificationBadge({ status }: { status: string }) {
  const entry = VERIFICATION_BADGE[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Badge label={entry.label} tone={entry.tone} />;
}
