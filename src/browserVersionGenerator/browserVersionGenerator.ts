/// <reference path="../../typings/main.d.ts" />
import fs = require("fs");
import path = require("path");
var mkdirp = require("mkdirp");
var webpack = require("webpack");
import cp = require('child_process')
import _=require("underscore")

function createBrowserPackage(minify = true) {
    console.log("Minify: " + minify);
    var rootPath = path.join(__dirname, "../../");

    var rootFile = path.join(rootPath, "/dist/index.js");

    var targetFolder = path.join(rootPath, "browserVersion");

    var targetFile = path.join(targetFolder, "raml-suggestions.js");
    
    mkdirp.sync(targetFolder);

    webPackForBrowser(rootPath, rootFile, targetFile, minify);
}

/**
 *
 * @param parserRootFolder - full path to cloned parser repository root folder
 * @param rootFile - full path to parser index JS file
 * @param targetFileName
 * @param callback
 */
function webPackForBrowser(parserRootFolder: string, rootFile : string, targetFile : string, minify: boolean) {
    console.log("Preparing to Webpack browser bundle:");

    var plugins: any[] = [];

    var relativeFilePath = path.relative(parserRootFolder, rootFile);
    relativeFilePath = "./"+relativeFilePath;

    var targetFolder = path.dirname(targetFile);
    var targetFileName = path.basename(targetFile);

    var config = {
        context: parserRootFolder,

        entry: relativeFilePath,

        output: {
            path: targetFolder,

            library: ['RAML', 'Suggestions'],

            filename: targetFileName
        },

        plugins: plugins,

        module: {
            loaders: [
                { test: /\.json$/, loader: "json" }
            ]
        },
        externals: [
            {
                "raml-1-parser": "RAML.Parser"
            }
        ],
        node: {
            console: false,
            global: true,
            process: true,
            Buffer: true,
            __filename: true,
            __dirname: true,
            setImmediate: true
        }
    };

    webpack(config, function(err: any, stats: any) {
        if(err) {
            console.log(err.message);

            return;
        }

        console.log("Webpack Building Browser Bundle:");

        console.log(stats.toString({reasons : true, errorDetails: true}));
    });
}

var args:string[] = process.argv;

if (_.find(args,arg=>arg=="-dev")) {
    createBrowserPackage(false);
} else {
    createBrowserPackage();
}