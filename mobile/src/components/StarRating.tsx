import { View, Pressable, Text, StyleSheet } from 'react-native';

interface StarRatingProps {
  value: number;
  onChange: (score: number) => void;
  disabled?: boolean;
}

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} disabled={disabled} hitSlop={8}>
          <Text style={[styles.star, star <= value && styles.starFilled]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 36, color: '#ccc' },
  starFilled: { color: '#f5a623' },
});
