/* eslint-disable no-undef */

const path = require("path");
const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const urlDev = "https://localhost:3000/";
const urlProd = "https://speaklogic-testing.vercel.app/";

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      react: ["react", "react-dom"],
      commands: "./src/commands/commands.ts",
      dialog: {
        import: ["./src/dialog/index.tsx", "./src/dialog/index.html"],
        dependOn: "react",
      },
      taskpane: {
        import: ["./src/taskpane/index.tsx", "./src/taskpane/index.html"],
        dependOn: "react",
      },
      identity: {
        import: ["./src/identity/identity.tsx", "./src/identity/identity.html"],
        dependOn: "react",
      },
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".html", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src"),
        "mammoth": path.resolve(__dirname, "node_modules/mammoth/mammoth.browser.js"),
        "html-docx-js": path.resolve(__dirname, "node_modules/html-docx-js/dist/html-docx.js"),
      },
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: ["ts-loader"],
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico|svg)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
      new HtmlWebpackPlugin({
        filename: "dialog.html",
        template: "./src/dialog/index.html",
        chunks: ["polyfill", "dialog", "react"],
      }),
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/index.html",
        // `commands` is bundled here so the shared runtime (Word/PowerPoint)
        // loads command handlers when the document opens. Outlook still uses
        // commands.html via Commands.Url since it can't use a shared runtime.
        chunks: ["polyfill", "taskpane", "react", "commands"],
      }),
      new HtmlWebpackPlugin({
        filename: "identity.html",
        template: "./src/identity/identity.html",
        chunks: ["polyfill", "identity", "react"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "assets/icons/*.svg",
            to: "assets/icons/[name][ext]",
          },
          {
            from: "assets/email-icons/*",
            to: "assets/email-icons/[name][ext]",
          },
          {
            from: "node_modules/sql.js/dist/sql-wasm.wasm",
            to: "assets/sql-wasm.wasm",
          },
          {
            // MathJax v3 (local copy) so equation rendering works OFFLINE —
            // never load it from a CDN (breaks the add-in's offline model).
            // Served at <origin>/mathjax/tex-mml-chtml.js; fonts resolve from
            // mathjax/output/chtml/fonts/woff-v2 relative to that file.
            from: "node_modules/mathjax/es5",
            to: "mathjax",
          },
          {
            from: "manifest*.xml",
            to: "[name][ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString()
                  .replace(new RegExp(urlDev, "g"), urlProd)
                  .replace(new RegExp(urlDev.slice(0, -1), "g"), urlProd.slice(0, -1));
              }
            },
          },
        ],
      }),
      new webpack.ProvidePlugin({
        Promise: ["es6-promise", "Promise"],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
      static: {
        directory: require("path").join(__dirname, "assets"),
        publicPath: "/assets",
      },
      server: {
        type: "https",
        options:
          env.WEBPACK_BUILD || options.https !== undefined
            ? options.https
            : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
