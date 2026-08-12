// Extend Jest matchers (toBeOnTheScreen, toHaveTextContent, etc.)
import '@testing-library/jest-native/extend-expect';

// Mock React Native Reanimated (required for Expo/animations)
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Silence warning: useNativeDriver (common RN warning)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo Router (since you're using expo-router)
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock navigation (fallback if you pass navigation manually)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Global fetch mock (for API calls)
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});