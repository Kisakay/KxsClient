const TerserPlugin = require('terser-webpack-plugin');
const { banner } = require('./banner');
const config = require('./config.json');
const webpack = require('webpack');
const path = require('node:path');

class AppendTimestampPlugin {
	apply(compiler) {
		compiler.hooks.emit.tapAsync('AppendTimestampPlugin', (compilation, callback) => {
			const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
			for (const filename in compilation.assets) {
				let source = compilation.assets[filename].source();
				source += `\n// Last modified code: ${timestamp}\n`;
				compilation.assets[filename] = {
					source: () => source,
					size: () => source.length,
				};
			}
			callback();
		});
	}
}

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
			},
			// Support for ?raw imports (CSS, HTML, etc.)
			{
				resourceQuery: /raw/,
				type: 'asset/source',
			},
			// Support for image imports
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'images/[name][ext]'
				}
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
		new AppendTimestampPlugin(),
	],
};