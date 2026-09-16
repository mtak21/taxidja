import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function AdminHome() {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} />
      <View style={styles.body}>
        <Text style={styles.text}>
          Le dashboard d'administration complet est disponible sur l'interface web séparée.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { textAlign: 'center', color: '#666', fontSize: 16 },
});
