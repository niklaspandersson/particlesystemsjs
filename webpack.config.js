const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'particlesystems.js',
    library: 'particleSystems',
    libraryTarget: 'umd'
  },
  optimization: {
    runtimeChunk: true
  }
};