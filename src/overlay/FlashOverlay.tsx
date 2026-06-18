import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { renderStore } from '../core/store';

type Props = { id: string; color: string };

export function RadarOverlay({ id, color }: Props): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;

  // Store'a abone ol — RadarOverlay'in kendisi izlenmediği için (içinde
  // useRenderTracker yok) bu yeniden render yeni bir kayıt üretmez: döngü yok.
  const stat = useSyncExternalStore(
    (cb) => renderStore.subscribeId(id, cb),
    () => renderStore.get(id),
    () => undefined,
  );
  const count = stat?.count ?? 0;

  useEffect(() => {
    if (count === 0) return;
    opacity.setValue(1);
    const anim = Animated.timing(opacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [count, opacity]);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.border, { borderColor: color, opacity }]}
      />
      <View pointerEvents="none" style={[styles.badge, { backgroundColor: color }]}>
        <Text testID="render-radar-badge" style={styles.badgeText}>
          {count}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 2,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
