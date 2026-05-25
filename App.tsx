import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.titulo}>🚀 Missão Espacial</Text>
      <Text style={styles.sub}>Centro de Controle</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07080f', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: '700', color: '#00c8ff' },
  sub: { fontSize: 14, color: '#6b7394', marginTop: 6 },
});
