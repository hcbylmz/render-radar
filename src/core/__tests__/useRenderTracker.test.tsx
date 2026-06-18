import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useRenderTracker } from '../useRenderTracker';
import { renderStore } from '../store';

function Probe({ value }: { value: number }) {
  useRenderTracker('Probe');
  return <Text>{value}</Text>;
}

describe('useRenderTracker', () => {
  beforeEach(() => {
    renderStore.reset();
    (global as any).__DEV__ = true;
  });

  it('increments count on every render', () => {
    const { rerender } = render(<Probe value={1} />);
    expect(renderStore.getAll()[0]?.count).toBe(1);
    rerender(<Probe value={2} />);
    expect(renderStore.getAll()[0]?.count).toBe(2);
  });

  it('records nothing in production mode', () => {
    (global as any).__DEV__ = false;
    render(<Probe value={1} />);
    expect(renderStore.getAll()).toHaveLength(0);
  });
});
