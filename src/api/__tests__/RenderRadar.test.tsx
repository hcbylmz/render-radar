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

  it('renders children + badge in dev mode', () => {
    const { getByText, getByTestId } = render(
      <RenderRadar name="Card">
        <Text>content</Text>
      </RenderRadar>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(getByTestId('render-radar-badge')).toBeTruthy();
  });

  it('renders only children in production mode (no overlay)', () => {
    (global as any).__DEV__ = false;
    const { getByText, queryByTestId } = render(
      <RenderRadar name="Card">
        <Text>content</Text>
      </RenderRadar>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(queryByTestId('render-radar-badge')).toBeNull();
  });
});
