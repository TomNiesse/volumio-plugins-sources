#!/bin/bash

echo "Installing lcd info Dependencies"
# Update the package sources, in case volumio2 is still used
sudo sed -i 's/deb/#deb/g' /etc/apt/sources.list
echo "deb http://raspbian.raspberrypi.org/raspbian/ buster main contrib non-free rpi" | sudo tee -a /etc/apt/sources.list
# Update the repos
sudo apt-get update
# Install the required packages via apt-get
sudo apt-get -y install make g++
# Install i2c, request and coffee-script
sudo npm install i2c coffee-script request

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#requred to end the plugin install
echo "plugininstallend"
