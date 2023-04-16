# What's this?

This repo contains a plugin that displays music info on a HD44780 20x4 LCD screen (using I2C).
The plugin displays the currently playing music (webradio and local music have been tested so far).
The displayed text will scroll by default, like in a car radio, but this can be turned off.

# Updated version

I used to have a repo with the same name, in which I wrote a volumio plugin that displays text on a 20x4 I2C LCD screen. That version has been rewritten.

An older version of the plugin can be found at https://github.com/TomNiesse/volumio20x4LCDPlugin_legacy. I will keep it around, since it's been shared on a few blogs.

# How to install the plugin

- Go to the Volumio Test Player by visiting the following url: `http://volumio.local/dev/` or `http://<volumio-ip-address>/dev`
- Enable `Plugins Test Mode` and `SSH`
- Connect to Volumio via SSH via `ssh volumio@volumio.local` or `ssh volumio@<volumio-ip-address>` using password `volumio`
- In the SSH client, clone this repository by executing `git clone https://github.com/TomNiesse/volumio-plugins-sources`
- Navigate to the plugin's folder by executing `cd volumio-plugins-sources/lcd_info`
- Execute the command `volumio plugin install` and wait for it to finish
  (Volumio 2.x will hang on "Finalizing installation", but the plugin has already been installed successfully; just hit CTRL-C after 5 minutes or so and continue to the next step)
- Close the SSH connection
- In the Volumio web interface, go to `Plugins` -> `Installed Plugins` and enable the plugin
- Restart Volumio

# Updating the plugin

- Connect to Volumio via SSH via `ssh volumio@volumio.local` or `ssh volumio@<volumio-ip-address>` using password `volumio`
- Go into the `volumio-plugins-sources` folder by executing `cd volumio-plugins-sources`
- Execute `git pull`
- Go into the `lcd_info` folder by executing `cd lcd_info`
- Execute `volumio plugin refresh`
- Execute `volumio vrestart` or `reboot`
