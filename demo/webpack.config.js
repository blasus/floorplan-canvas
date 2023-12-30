const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Gets absolute path of file within app directory
const resolveAppPath = relativePath => path.resolve(__dirname, relativePath);

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolveAppPath("./src/index.html"),
      filename: "index.html",
      inject: true
    })
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devServer: {
    // enable compression
    compress: true,

    // enable hot reloading
    hot: true,

    host: "localhost",

    port: 8080,

    client: {
      // show full-screen overlay when there are compiler errors or warnings
      overlay: true,
    },

    static: {
      directory: resolveAppPath("./src")
    }
  },
  output: {
    filename: "bundle.js",
    path: resolveAppPath("../dist/demo"),
    clean: true
  },
};
