let path = require("path");
let webpack = require("webpack");
let fs = require("fs");

module.exports = {
    entry: {
        main: path.resolve(__dirname, "out/js/Vollgas_global.js"),
    },
    mode: "development",
    output: {
        path: path.resolve(__dirname, "docs/"),
        filename: "vollgas.js"
    },
    plugins: [
        new webpack.BannerPlugin(fs.readFileSync("./license_header.txt", "utf8"))
    ]
};
