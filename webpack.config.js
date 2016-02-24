/* global __dirname:false */
var path = require('path');

const DEBUG = process.argv.indexOf('-p') === -1;

module.exports = {
    entry: './src/bioinput.js',
    devtool: DEBUG ? 'cheap-module-eval-source-map' : false,
    target: 'web',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'bioinput.js',
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
            }
        ]
    }
};
