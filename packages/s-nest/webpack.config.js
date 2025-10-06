const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = (options, webpack) => {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      plugins: [
        ...(options.resolve?.plugins || []),
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, 'tsconfig.json'),
        }),
      ],
    },
  };
};
