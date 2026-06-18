import React from 'react';
import { StyleSheet, View } from 'react-native';
import { isDev } from '../core/isDev';
import { useRenderTracker } from '../core/useRenderTracker';
import { RadarOverlay } from '../overlay/FlashOverlay';

export type RenderRadarProps = {
  name: string;
  color?: string;
  children: React.ReactNode;
};

export function RenderRadar({ name, color = '#ff3b30', children }: RenderRadarProps): JSX.Element {
  // isDev() is constant for the app's lifetime, so this branch never breaks hook order.
  if (!isDev()) {
    return <>{children}</>;
  }
  return (
    <RenderRadarDev name={name} color={color}>
      {children}
    </RenderRadarDev>
  );
}

function RenderRadarDev({
  name,
  color,
  children,
}: {
  name: string;
  color: string;
  children: React.ReactNode;
}): JSX.Element {
  // The tracked side: it records but does NOT subscribe to the store.
  const id = useRenderTracker(name);
  return (
    <View style={styles.container}>
      {children}
      {/* The subscriber side: listens to the store but is not tracked → no loop. */}
      <RadarOverlay id={id} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
