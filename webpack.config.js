const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: {
    'main': ['babel-polyfill', './src/app.js'],
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin()
  ]
};
