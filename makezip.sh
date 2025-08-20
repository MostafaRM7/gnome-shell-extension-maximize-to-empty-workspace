#!/bin/sh

NAME=MaximizeToEmptyWorkspace-extension@MostafaRM7.github.io
cd $NAME
zip -r $NAME.zip *
mv $NAME.zip ../..
cd ..

