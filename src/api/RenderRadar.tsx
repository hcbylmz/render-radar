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
  // isDev() uygulama ömrü boyunca sabittir; bu dallanma hook sırasını bozmaz.
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
  // İzlenen taraf: kaydeder ama store'a abone DEĞİL.
  const id = useRenderTracker(name);
  return (
    <View style={styles.container}>
      {children}
      {/* Abone taraf: store'u dinler ama izlenmez → döngü yok. */}
      <RadarOverlay id={id} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
