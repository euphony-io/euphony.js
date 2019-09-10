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
        filename: 'euphony-0.1.3.min.mjs',
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
                                    'Chrome >= 60',
                                    'Safari >= 10.1',
                                    'iOS >= 10.3',
                                    'Firefox >= 54',
                                    'Edge >= 15',
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
