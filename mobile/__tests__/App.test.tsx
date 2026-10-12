import React from 'react';
import renderer, { act } from 'react-test-renderer';
import App from '../App';
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
it('renders student sign-in on a fresh launch', async () => {
  let tree: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  expect(JSON.stringify(tree!.toJSON())).toContain('Welcome back');
  await act(async () => {
    tree!.unmount();
  });
});
