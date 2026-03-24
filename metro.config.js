const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

// Cho phép Metro bundle file .tflite (TensorFlow Lite model)
config.resolver.assetExts.push('tflite');

module.exports = withNativeWind(config, { input: './src/app/global.css' })