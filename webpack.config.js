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
  devServer: { inline: true, contentBase: "build/" },
  entry: {
    app: ["./build/main.js"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/assets/",
    filename: "bundle.js"
  }
}
