/* global __dirname:false */
var path = require('path');

const DEV = process.argv.indexOf('-p') === -1;

module.exports = {
    entry: './src/bioinput.js',
    devtool: DEV ? 'cheap-module-eval-source-map' : false,
    target: 'web',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: DEV ? 'bioinput.js' : 'bioinput.min.js',
    },
    externals: {
      'jquery': 'jQuery',
    },
    module: {
        loaders: [
            {
              test: /\.js$/,
              loader: 'babel',
              query: {
                presets: ['es2015']
              }
            },
            {
              test: /\.scss$/,
              loaders: ['style', 'css', 'sass']
            }
        ]
    }
};
