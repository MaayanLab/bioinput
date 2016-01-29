/* eslint-disable */

var webpack = require('webpack');

module.exports = {
  entry: './src/bioinput.js',
  devtool: 'source-map',
  output: {
    path: __dirname,
    filename: 'bioinput.final.js',
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          presets: 'es2015',
          plugins: ['transform-object-rest-spread'],
        },
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css?sourceMap', 'sass?sourceMap'],
      },
    ],
  },
  stats: {
    colors: true,
  },
  plugins: [
      // Avoid publishing files when compilation fails
    new webpack.NoErrorsPlugin(),
  ],
};
