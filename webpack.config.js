const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { banner } = require('./banner');
const config = require('./config.json');
module.exports = {
	entry: './src/index.ts',
	output: {
		filename: config.fileName,
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: {
					loader: 'ts-loader',
					options: {
						compilerOptions: {
							noEmit: false
						}
					}
				},
				exclude: /node_modules/,
			},
			{
				test: /\.html$/i,
				type: 'asset/source',
			}
		],
	},
	mode: 'production',
	devtool: false,
	optimization: {
		minimize: false,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: {
						comments: /@name|@namespace|@version|@description|@author|@license|@require|@run-at|@match|@grant|@downloadURL|@updateURL|==UserScript==|==\/UserScript==/,
					},
				},
				extractComments: false,
			}),
		],
	},
	plugins: [
		new webpack.BannerPlugin({
			banner: banner,
			raw: true,
		}),
	],
};
