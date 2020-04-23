/**
 *
 * Webpack config for euphony.js library
 *
 * Author : jbear; JI-WOONG CHOI
 * Contact : https://jbear.co
 * Copyright @ jbear
 *
 **/

const path = require('path');

module.exports = {
    entry:
    {
        'euphony.dev' : ['./euphony.js'],
    },
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
                exclude: /(node_modules|bower_components)/,
            }
        ]
    },
    optimization: {
        minimize:false
    }
};
