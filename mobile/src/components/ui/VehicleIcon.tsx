import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type VehicleKind = 'MOTO' | 'RAKCHA' | 'CAR';

const ICON_NAMES: Record<VehicleKind, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  MOTO: 'moped',
  RAKCHA: 'rickshaw',
  CAR: 'car-side',
};

interface VehicleIconProps {
  type: VehicleKind;
  size?: number;
  color?: string;
}

export function VehicleIcon({ type, size = 30, color = colors.primary }: VehicleIconProps) {
  return <MaterialCommunityIcons name={ICON_NAMES[type]} size={size} color={color} />;
}
