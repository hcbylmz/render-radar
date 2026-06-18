import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { RenderRadar } from '../RenderRadar';
import { renderStore } from '../../core/store';

describe('RenderRadar', () => {
  beforeEach(() => {
    renderStore.reset();
    (global as any).__DEV__ = true;
  });
  afterEach(() => {
    (global as any).__DEV__ = true;
  });

  it('dev modunda children + rozet render eder', () => {
    const { getByText, getByTestId } = render(
      <RenderRadar name="Card">
        <Text>içerik</Text>
      </RenderRadar>,
    );
    expect(getByText('içerik')).toBeTruthy();
    expect(getByTestId('render-radar-badge')).toBeTruthy();
  });

  it('production modunda yalnızca children render eder (overlay yok)', () => {
    (global as any).__DEV__ = false;
    const { getByText, queryByTestId } = render(
      <RenderRadar name="Card">
        <Text>içerik</Text>
      </RenderRadar>,
    );
    expect(getByText('içerik')).toBeTruthy();
    expect(queryByTestId('render-radar-badge')).toBeNull();
  });
});
