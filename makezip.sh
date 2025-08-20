#!/bin/sh

NAME=MaximizeToEmptyWorkspace-extension@basalam3922.github.io
cd $NAME
zip -r $NAME.zip *
mv $NAME.zip ../..
cd ..

