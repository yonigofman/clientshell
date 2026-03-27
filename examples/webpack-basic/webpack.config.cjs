const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ClientshellWebpackPlugin } = require("@clientshell/webpack");

module.exports = {
  mode: "development",
  entry: "./src/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new ClientshellWebpackPlugin({
      manifestPath: "./clientshell.manifest.json",
      devValues: {
        API_URL: "http://localhost:3000",
        ENABLE_NEW_UI: true,
      },
    }),
  ],
};
