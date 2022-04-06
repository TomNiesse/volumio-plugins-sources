#!/bin/bash

echo "Installing lcd info Dependencies"
sudo apt-get update
# Install the required packages via apt-get
sudo apt-get -y install make g++
# Install i2c and coffee-script globally, since the volumio installer is not what it used to be
sudo npm install i2c coffee-script request

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#requred to end the plugin install
echo "plugininstallend"
