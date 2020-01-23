const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/demo/index.ts',
  output: {
    path: path.resolve(__dirname, 'demo'),
  },

  devtool: "source-map",
  devServer: {
    contentBase: path.join(__dirname, 'demo'),
    compress: true,
    port: 9000
  },

  resolve: {
    extensions: [".ts", ".js"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.ts$/,
        loader: "ts-loader"
      },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      }
    ]
  }
};