#!/bin/sh

brew install lame
brew install sox --with-lame
brew install opus-tools 
brew install mopidy
brew install node

npm -g install nan
npm -g install snowboy
npm -g install miio
npm -g install mdns

npm install

npm link snowboy
npm link miio
npm link mdns