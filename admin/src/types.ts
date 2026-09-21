export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';
export type VehicleType = 'MOTO' | 'RAKCHA' | 'CAR';
export type RideStatus =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'ACCEPTED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type DriverVerificationStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalDrivers: number;
  onlineDrivers: number;
  totalVehicles: number;
  ridesToday: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDriverVehicle {
  id: string;
  type: VehicleType;
  brand: string | null;
  model: string | null;
  plate: string | null;
  color: string | null;
  isActive: boolean;
}

export interface AdminDriver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  onlineStatus: boolean;
  rating: number;
  totalTrips: number;
  verificationStatus: DriverVerificationStatus;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  vehicles: AdminDriverVehicle[];
  createdAt: string;
}

export interface AdminVehicle {
  id: string;
  driverId: string;
  driverName: string;
  type: VehicleType;
  plate: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminRideListItem {
  id: string;
  vehicleType: VehicleType;
  pickupAddress: string | null;
  destinationAddress: string | null;
  distance: number;
  estimatedPrice: number;
  finalPrice: number | null;
  status: RideStatus;
  requestedAt: string;
  passenger: { firstName: string; lastName: string };
  driver: { firstName: string; lastName: string } | null;
}

export interface AdminRideDetail extends AdminRideListItem {
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  estimatedDuration: number;
  acceptedAt: string | null;
  arrivingAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  passenger: { firstName: string; lastName: string; phone: string };
  driver: { firstName: string; lastName: string; phone: string; rating: number } | null;
  rating: { score: number; comment: string | null } | null;
}

export interface City {
  id: string;
  name: string;
  isActive: boolean;
  zones: Zone[];
}

export interface Zone {
  id: string;
  cityId: string;
  name: string;
  isActive: boolean;
}

export interface PricingConfig {
  id: string;
  vehicleType: VehicleType;
  baseFare: number;
  pricePerKm: number;
}
