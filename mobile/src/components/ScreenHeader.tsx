import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLogout } from '../hooks/useLogout';

export function ScreenHeader({ title }: { title: string }) {
  const handleLogout = useLogout();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <Pressable onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  logoutText: { color: '#d32f2f', fontWeight: '600' },
});
