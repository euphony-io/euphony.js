/**
 *
 * Webpack config for euphony.js library
 *
 * Author : jbear; JI-WOONG CHOI
 * Contact : http://jbear.co
 * Copyright @ jbear
 *
 **/

const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './euphony.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'euphony-0.1.3.min.js',
	libraryTarget: 'window',
	globalObject: 'this',
	libraryExport: 'default',
	library: 'euphony.js'
    },
	optimization: {
		minimizer: [
			new UglifyJsPlugin({ 
			cache: true,
			uglifyOptions: {
				mangle: {
					keep_fnames:true	
				},
				compress: {
					keep_fnames:true,
					drop_console:true
				}	
			}	
			} )
		]
	},
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.m?js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['env', {
                            modules: false,
                            useBuiltIns: true,
                            targets: {
                                browsers: [
                                    '> 1%',
                                    'last 2 versions',
                                    'Firefox ESR',
                                ],
                            },
                        }],
                    ],
                },
                exclude: /(node_modules|bower_components)/,
            }
        ]
    }
};
