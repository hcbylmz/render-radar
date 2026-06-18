import React from 'react';
import { render } from '@testing-library/react-native';
import { RadarOverlay } from '../FlashOverlay';
import { renderStore } from '../../core/store';

describe('RadarOverlay', () => {
  beforeEach(() => {
    renderStore.reset();
  });

  it('shows the store count in the badge', () => {
    renderStore.record('X#1', 'X', 1);
    const { getByTestId } = render(<RadarOverlay id="X#1" color="#ff0000" />);
    expect(getByTestId('render-radar-badge').props.children).toBe(1);
  });

  it('shows 0 when there is no stat for the id', () => {
    const { getByTestId } = render(<RadarOverlay id="missing" color="#ff0000" />);
    expect(getByTestId('render-radar-badge').props.children).toBe(0);
  });
});
