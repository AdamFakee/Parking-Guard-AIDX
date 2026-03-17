import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

interface EditPlateModalProps {
  isVisible: boolean;
  initialPlate: string;
  onClose: () => void;
  onSave: (plate: string) => void;
}

export const EditPlateModal = ({ isVisible, initialPlate, onClose, onSave }: EditPlateModalProps) => {
  const [tempPlate, setTempPlate] = useState('');

  useEffect(() => {
    if (isVisible) {
      setTempPlate(initialPlate);
    }
  }, [isVisible, initialPlate]);

  const handleSave = () => {
    onSave(tempPlate.toUpperCase());
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, elevation: 5 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>Sửa biển số xe</Text>
            
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 }}>
              <TextInput
                value={tempPlate}
                onChangeText={setTempPlate}
                placeholder="Nhập biển số..."
                autoFocus
                autoCapitalize="characters"
                style={{ fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', color: '#1e293b' }}
              />
            </View>

            <View style={{ flexDirection: 'row' }}>
              <Pressable 
                onPress={onClose}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', marginRight: 12 }}
              >
                <Text style={{ fontWeight: 'bold', color: '#64748b' }}>HỦY</Text>
              </Pressable>
              <Pressable 
                onPress={handleSave}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: 'bold', color: 'white' }}>LƯU</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
