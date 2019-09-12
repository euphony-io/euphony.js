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
    entry: {
        'euphony-latest.min' : './euphony.js',
        'euphony-0.1.3.min' : './euphony.js'
           },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
	libraryTarget: 'window',
	globalObject: 'this',
	libraryExport: 'default',
	library: 'euphony.js'
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
