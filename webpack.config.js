// webpack.config.js
var path = require("path");
module.exports = {
  module: {
      loaders: [
          { test: /\.css$/, loader: "style-loader!css-loader" },
                {
                  test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
                  loader: 'url-loader'
                }
      ]
  },
  devServer: { inline: true, contentBase: "./" },
  entry: {
    app: ["./src/main.js"]
  },
  output: {
    path: path.resolve(__dirname, "assets"),
    publicPath: "/assets/",
    filename: "[name].js"
  }
}
