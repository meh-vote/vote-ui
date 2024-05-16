const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'none',
    entry: './src/main.js',
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
        }),
        new CopyPlugin({
            patterns: [
                { from: 'src/css', to: 'css' },
                { from: 'src/data', to: 'data' },
                { from: 'src/images', to: 'images' },
                { from: 'src/favicon.ico', to: 'favicon.ico' },
            ]
        }),
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          }
        ]
      }    
};
