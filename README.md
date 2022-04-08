# volumio-plugins-sources fork
Volumio plugins source code for Volumio 3; a fork

# What's this?

This fork of the volumio sources adds a plugin that displays music info on a HD44780 20x4 LCD screen (using I2C).
The plugin displays the currently playing music (webradio and local music have been tested so far).
The displayed text will scroll by default, like in a car radio, but this can be turned off.

# How to install the plugin

- Go to the Volumio Test Player by visiting the following url: `http://volumio.local/dev/` or `http://<volumio-ip-address>/dev`
- Enable `Plugins Test Mode` and `SSH`
- Connect to Volumio via SSH via `ssh volumio@volumio.local` or `ssh volumio@<volumio-ip-address>` using password `volumio`
- In the SSH client, clone this repository by executing `git clone https://github.com/TomNiesse/volumio-plugins-sources`
- Navigate to the plugin's folder by executing `cd volumio-plugins-sources/lcd_info`
- Execute the command `volumio plugin install` and wait for it to finish
- Close the SSH connection
- In the Volumio web interface, go to `Plugins` -> `Installed Plugins` and enable the plugin
- Restart Volumio
