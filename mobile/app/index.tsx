import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />;
}
