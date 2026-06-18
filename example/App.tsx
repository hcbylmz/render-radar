import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RenderRadar } from 'render-radar';

function Box({ label }: { label: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxText}>{label}</Text>
    </View>
  );
}

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>render-radar demo</Text>
      <Text style={styles.subtitle}>Butona bas → kutu her render'da flash'lar</Text>

      <Pressable style={styles.button} onPress={() => setCount((c) => c + 1)}>
        <Text style={styles.buttonText}>Render tetikle ({count})</Text>
      </Pressable>

      <RenderRadar name="Box">
        <Box label="İzleniyorum 👀" />
      </RenderRadar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 20,
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#666' },
  button: {
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  box: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    backgroundColor: '#eef',
    borderRadius: 8,
  },
  boxText: { fontSize: 16 },
});
