const { merge } = require("webpack-merge");
const common = require("./webpack.config.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map", // Best source map option for development (balance of speed and quality)
  devServer: {
    static: "./public",
    hot: true,
    open: true,
    port: 3000,
    historyApiFallback: true,
    client: {
      overlay: true, // Shows errors as overlay on the page
    },
    allowedHosts: "all",
    host: "0.0.0.0",
  },
});
