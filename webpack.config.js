const path = require('path');

module.exports = {
    // Entry point of the application
    entry: './src/index.js', // Change this if you use a different entry file

    // Output configuration
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },

    resolve: {
        // Create polyfills for Node.js core modules
        fallback: {
            crypto: path.resolve(__dirname, 'node_modules/crypto-browserify'),
            stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
            util: require.resolve('util'),
        },
    },

    module: {
        rules: [
            // Babel loader for React JSX and ES6 code
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            // For styles if you're using CSS/SASS
            {
                test: /\.(css|scss)$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },

    // Development server configuration (optional)
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
    },

    // Source map configuration for debugging
    devtool: 'source-map',

    // Plugins (optional, e.g., for optimizing the build)
    plugins: [
        // Any plugins you want to add, such as HTMLWebpackPlugin for HTML template
    ],
};
