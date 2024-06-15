const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

// const localKaldiUrl = 'wss://prn509.vdu.lt/client/ws'
const localPunctuationUrl = 'https://prn509.vdu.lt/punctuation/punctuation'
const localKaldiUrl = 'ws://localhost:8084/client/ws'
// const localPunctuationUrl = 'http://localhost:8083/punctuation'

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'
  const baseHref = isProduction ? 'BASE_HREF' : '/'
  const kaldiUrl = isProduction ? 'KALDI_URL' : localKaldiUrl
  const punctuationUrl = isProduction ? 'PUNCTUATION_URL' : localPunctuationUrl
  return {
    mode: argv.mode,
    entry: './src/js/recorder.js', // Entry point of your application
    output: {
      filename: 'bundle.js', // Output bundle filename
      path: path.resolve(__dirname, 'dist') // Output directory
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        filename: 'index.html',
        templateParameters: (compilation, assets, assetTags, options) => {
          return {
            BASE_HREF: baseHref,
            KALDI_URL: kaldiUrl,
            PUNCTUATION_URL: punctuationUrl
          }
        }
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: '*.css', to: 'css', context: 'src/css' }
        ]
      }),
      new webpack.DefinePlugin({
        'process.env': {
          BUILD_VERSION: JSON.stringify(process.env.BUILD_VERSION)
        }
      })
    ],
    devtool: 'source-map',
    devServer: {
      static: './dist',
      watchFiles: ['src/**/*', 'index.html'],
      historyApiFallback: true,
      client: {
        overlay: false
      }
    }
  }
}
