const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: false, // No source maps in production for better performance
  performance: {
    hints: 'warning', // Warns about large bundles
  },
}); 