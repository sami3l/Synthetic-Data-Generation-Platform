module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }]
    ],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // React Native Reanimated plugin (should be last)
      'react-native-reanimated/plugin',
       
    ],
  };
};