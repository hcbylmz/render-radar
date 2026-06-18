import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useRenderRadar } from '../useRenderRadar';
import { renderStore } from '../../core/store';

function Counter({ value }: { value: number }) {
  const count = useRenderRadar('Counter');
  return <Text testID="count">{count}</Text>;
}

describe('useRenderRadar', () => {
  beforeEach(() => {
    renderStore.reset();
    (global as any).__DEV__ = true;
  });

  it('render sayısını döner ve store günceller', () => {
    const { getByTestId, rerender } = render(<Counter value={1} />);
    expect(getByTestId('count').props.children).toBe(1);
    rerender(<Counter value={2} />);
    expect(getByTestId('count').props.children).toBe(2);
  });

  it('production modunda store boş kalır', () => {
    (global as any).__DEV__ = false;
    render(<Counter value={1} />);
    expect(renderStore.getAll()).toHaveLength(0);
  });
});
