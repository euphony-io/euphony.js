/**
 *
 * Webpack config for euphony.js library
 *
 * Author : jbear; JI-WOONG CHOI
 * Contact : https://jbear.co
 * Copyright @ jbear
 *
 **/


require('core-js/stable');
require('regenerator-runtime/runtime');

const path = require('path');

module.exports = {
    entry: //[//"core-js",
    {'euphony.min' : ['core-js/stable', './euphony.js']},
//],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
	libraryTarget: 'window',
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.m?js$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                targets:[
                                    ">0.25%",
                                    "last 2 versions"]
                            }
                        ]
                    ],
                },
                exclude: /(node_modules|bower_components)/,
            }
        ]
    }
};
