import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

const SIZE_GUIDE = [
  { label: 'Small bowl', value: '~150ml' },
  { label: 'Medium bowl', value: '~200-250ml' },
  { label: 'Large bowl', value: '~300-350ml' },
  { label: 'Standard katori', value: '~150ml' },
];

export default function QuantityEditor({ visible, item, onSave, onClose }) {
  const [quantity, setQuantity] = useState(item?.quantity_description || '');
  const [calories, setCalories] = useState(String(Math.round(item?.calories || 0)));

  const handleSave = () => {
    onSave({
      ...item,
      quantity_description: quantity,
      calories: parseFloat(calories) || item?.calories,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit Quantity</Text>
          <Text style={styles.foodName}>{item?.name}</Text>

          <Input
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 2 rotis, 300 grams, 1 large bowl"
          />

          <Input
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholder="Adjusted calories"
          />

          <Text style={styles.guideTitle}>SIZE REFERENCE</Text>
          {SIZE_GUIDE.map((s) => (
            <View key={s.label} style={styles.guideRow}>
              <Text style={styles.guideLabel}>{s.label}</Text>
              <Text style={styles.guideValue}>{s.value}</Text>
            </View>
          ))}

          <View style={styles.buttons}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Save" onPress={handleSave} style={{ flex: 1, marginLeft: 12 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  foodName: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  guideTitle: { fontSize: 13, fontWeight: '500', color: colors.textTertiary, letterSpacing: 0.5, marginTop: 8, marginBottom: 8 },
  guideRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  guideLabel: { fontSize: 13, color: colors.textSecondary },
  guideValue: { fontSize: 13, color: colors.textTertiary },
  buttons: { flexDirection: 'row', marginTop: 24 },
});
