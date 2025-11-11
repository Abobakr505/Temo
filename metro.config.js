const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إضافة دعم Reanimated
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-reanimated/plugin'),
};

module.exports = config;