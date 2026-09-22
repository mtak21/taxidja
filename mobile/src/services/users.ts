import { api } from './api';
import type { AuthUser } from '../store/authStore';

export async function updateProfile(input: { firstName?: string; lastName?: string; email?: string }) {
  const { data } = await api.patch<{ user: AuthUser }>('/users/me', input);
  return data.user;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await api.patch('/users/me/password', { oldPassword, newPassword });
}

/** Uploads a local image (e.g. from expo-image-picker) as the user's avatar. */
export async function uploadAvatar(fileUri: string): Promise<AuthUser> {
  const filename = fileUri.split('/').pop() ?? 'avatar.jpg';
  const extension = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase();
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  // React Native's FormData accepts this {uri, name, type} shape for file
  // fields — it isn't a real Blob/File, so the DOM FormData type doesn't
  // cover it.
  formData.append('avatar', { uri: fileUri, name: filename, type: mimeType } as unknown as Blob);

  const { data } = await api.post<{ user: AuthUser }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.user;
}
