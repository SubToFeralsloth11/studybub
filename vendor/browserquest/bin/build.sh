#!/bin/bash

# Script to generate an optimized client build of BrowserQuest

BUILDDIR="../client-build"
PROJECTDIR="../client/js"
CURDIR=$(pwd)


echo "Deleting previous build directory"
rm -rf $BUILDDIR

echo "Building client with RequireJS"
cd $PROJECTDIR
node ../../bin/r.js -o build.js
cd $CURDIR

echo "Keeping all js files in the build directory (the map worker importScripts several of them)"

echo "Removing sprites directory"
rm -rf $BUILDDIR/sprites

echo "Removing config directory"
rm -rf $BUILDDIR/config

echo "Moving build.txt to current dir"
mv $BUILDDIR/build.txt $CURDIR

echo "Build complete"