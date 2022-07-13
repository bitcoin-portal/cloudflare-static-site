const path = require("path");

module.exports = {
  entry: {
    bundle: path.join(__dirname, "./src/index.ts"),
  },

  output: {
    filename: "bundle.js",
    path: path.join(__dirname, "dist"),
  },

  mode: process.env.NODE_ENV || "development",

  watchOptions: {
    ignored: /node_modules|dist|\.js/g,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    plugins: [],
  },

  devtool: "source-map",

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
      },
    ],
  },
};
