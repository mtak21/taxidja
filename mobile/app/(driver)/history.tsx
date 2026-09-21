import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { RideHistoryList } from '../../src/components/RideHistoryList';
import { colors } from '../../src/theme/colors';

export default function DriverHistoryScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Mes courses" />
      <RideHistoryList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
