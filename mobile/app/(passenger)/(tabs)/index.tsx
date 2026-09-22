import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppMap } from '../../../src/components/AppMap';
import { useLocation } from '../../../src/hooks/useLocation';
import { Button } from '../../../src/components/ui/Button';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function PassengerHome() {
  const { coordinates, loading, errorMessage } = useLocation();

  const handleReserve = () => {
    router.push('/(passenger)/book');
  };

  return (
    <View style={styles.container}>
      <AppMap
        coordinates={coordinates}
        loading={loading}
        errorMessage={errorMessage}
        markerTitle="Ma position"
      />

      <View style={styles.actions}>
        <Button title="Réserver une course" onPress={handleReserve} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, backgroundColor: colors.background },
  actions: { padding: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
});
