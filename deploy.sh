#!/bin/sh

NAME=MaximizeToEmptyWorkspace-extension@MostafaRM7.github.io
rm -rf ~/.local/share/gnome-shell/extensions/$NAME
cp -r $NAME ~/.local/share/gnome-shell/extensions/.
