var webpack = require('webpack');
var path = require('path');

const __DEV__ = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: path.join(__dirname, 'src', 'bioinput.js'),
  devtool: __DEV__ ? 'source-map' : null,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bioinput.js',
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
