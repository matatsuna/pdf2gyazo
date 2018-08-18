const path = require('path');

module.exports = {
  mode:'production',
  entry: {
    'main': ['babel-polyfill', './src/app.js'],
    'pdf.worker': './node_modules/pdfjs-dist/build/pdf.worker.entry'
  },
  output: {
    path: path.join(__dirname, '/build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
      }
    ]
  }
};
