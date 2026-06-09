const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// One canonical entry for react-native-svg so Metro never loads both `src/index`
// and `lib/...` in the same graph (which registers RNSVG* Fabric views twice).
const reactNativeSvgEntry = path.resolve(
  projectRoot,
  'node_modules/react-native-svg/src/index.ts',
);

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return { type: 'sourceFile', filePath: reactNativeSvgEntry };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
