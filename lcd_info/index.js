'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var i2c = require('i2c'); // for LCD control
var request = require('request'); // used in getState()

// Make sure String knows what ljust is (ported from python)
String.prototype.ljust = function( length, char ) {
    var fill = [];
    while(fill.length + this.length < length) {
        fill[fill.length] = char;
    }
    return this + fill.join('');
}

//
// LCD screen variables
//
var LCD_I2C_ADDRESS = 0x3F; // defaults to 0x3F
var LCD_WIDTH = 20;
var LCD_MODE_DATA    = 1;
var LCD_MODE_COMMAND = 0;
var LCD_ENABLE = 0x04;
// Addresses for the different lines on the screen
var LCD_LINE_0 = 0x80;
var LCD_LINE_1 = 0xC0;
var LCD_LINE_2 = 0x94;
var LCD_LINE_3 = 0xD4;
// Backlight controls
var LCD_BACKLIGHT  = 0x08; // 0x08 = ON, 0x00 = OFF
// Delay time
var DELAY = 0.0000005;

module.exports = lcdInfo;
function lcdInfo(context) {
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.wire = new i2c(LCD_I2C_ADDRESS, {device: '/dev/i2c-1'});
    this.lcdInit(); // Initialize the lcd screen
}

lcdInfo.prototype.sleep = function(ms) {
    var now = new Date().getTime();
    while(new Date().getTime() < now + ms){ /* Do nothing */ }
}

lcdInfo.prototype.sleep_async = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

lcdInfo.prototype.lcdToggle = function(bits) {
    this.sleep(DELAY);
    this.wire.writeByte(bits | LCD_ENABLE, function(err) {});
    this.sleep(DELAY);
    this.wire.writeByte(bits & ~LCD_ENABLE, function(err) {});
    this.sleep(DELAY);
}

lcdInfo.prototype.lcdSendByte = function(bits, mode) {
    var bits_high = mode | (bits & 0xF0) | LCD_BACKLIGHT;
    var bits_low = mode | ((bits<<4) & 0xF0) | LCD_BACKLIGHT;

    this.wire.writeByte(bits_high, function(err) {});
    this.lcdToggle(bits_high);
    this.sleep(DELAY);
    this.wire.writeByte(bits_low, function(err) {});
    this.lcdToggle(bits_low);
}

lcdInfo.prototype.lcdInit = function() {
    this.lcdSendByte(0x33,LCD_MODE_COMMAND); // 110011 Init
    this.lcdSendByte(0x32,LCD_MODE_COMMAND); // 110010 init
    this.lcdSendByte(0x06,LCD_MODE_COMMAND); // 000110 Cursor move
    this.lcdSendByte(0x0C,LCD_MODE_COMMAND); // 001100 Display on, cursor off, blink off
    this.lcdSendByte(0x28,LCD_MODE_COMMAND); // 101000 Data length, number of lines, font size
    this.lcdSendByte(0x01,LCD_MODE_COMMAND); // Clear display
}

lcdInfo.prototype.lcdString = function(message, line) {
    // Make sure there is a message at all
    if(message === null) {
	return;
    }

    // If the message is too long, cut it off
    // TODO: support scrolling as well
    if(message.length > 20) {
        message = message.substr(0, 20);
    }

    // Pad the message if it is too short
    message = message.ljust(LCD_WIDTH," ");

    // Set the right line
    this.lcdSendByte(line, LCD_MODE_COMMAND);

    // Write all characters to the LCD screen
    for(var pos = 0; pos < LCD_WIDTH; pos++) {
        this.lcdSendByte(message[pos].charCodeAt(0),LCD_MODE_DATA);
    }
}

lcdInfo.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
        this.lcdString("Volumio has started", LCD_LINE_0);

    return libQ.resolve();
}

lcdInfo.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();

        this.lcdString("Plugin has started", LCD_LINE_1);
        this.getState(); // start reading data from volumio

	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

lcdInfo.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    this.lcdInit();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

lcdInfo.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
    this.lcdInit();
};


// Configuration Methods -----------------------------------------------------------------------------

lcdInfo.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
            uiconf.sections[0].content[0].value = self.config.get("i2c_address");

            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    self.commandRouter.pushToastMessage('success', "Load settings", "Loaded");

    return defer.promise;
};

lcdInfo.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

lcdInfo.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

lcdInfo.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

lcdInfo.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

lcdInfo.prototype.saveI2CSettings = function(data) {
        var self = this;
        var defer = libQ.defer();

        if(data["i2c_address"].length) {
            // Check if the input is a valid address
            self.config.set('i2c_address', data["i2c_address"]);
            self.commandRouter.pushToastMessage("success", "Saved", "I2C settings have been saved");
        } else {
            self.commandRouter.pushToastMessage("error", "Empty input in configuration", "I2C settings have NOT been saved");
        }

        return defer.promise;
}


lcdInfo.prototype.saveDisplaySettings = function(data) {
        var self = this;
        var defer = libQ.defer();

        self.config.set('scroll_type', data["scroll_type"]);

        self.commandRouter.pushToastMessage("success", "Saved", "Display settings have been saved");

        return defer.promise;
}

// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


lcdInfo.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

lcdInfo.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
lcdInfo.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

lcdInfo.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
lcdInfo.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::stop');


};

// Spop pause
lcdInfo.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::pause');


};

// Get state
lcdInfo.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::getState');

	let url = "http://0.0.0.0:3000/api/v1/getState";
	let options = {json: true};
	request(url, options, (error, res, body) => {
		if (error) {
			self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::getState -> could not get status at this time.');
			return;
		};
		if (!error && res.statusCode == 200) {
			self.lcdString(body.title, LCD_LINE_0);
			self.lcdString(body.artist, LCD_LINE_1);
			self.lcdString(body.album, LCD_LINE_2);
			self.lcdString(body.status, LCD_LINE_3);
		};
	});

        this.sleep_async(1000).then(() => {
            this.getState();
        });
};

//Parse state
lcdInfo.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::parseState');
};

// Announce updated State
lcdInfo.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'lcdInfo::pushState');
	//return self.commandRouter.servicePushState(state, self.servicename);
};


lcdInfo.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI
	return defer.promise;
};

lcdInfo.prototype.getAlbumArt = function (data, path) {

	var artist, album;

	if (data != undefined && data.path != undefined) {
		path = data.path;
	}

	var web;

	if (data != undefined && data.artist != undefined) {
		artist = data.artist;
		if (data.album != undefined)
			album = data.album;
		else album = data.artist;

		web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
	}

	var url = '/albumart';

	if (web != undefined)
		url = url + web;

	if (web != undefined && path != undefined)
		url = url + '&';
	else if (path != undefined)
		url = url + '?';

	if (path != undefined)
		url = url + 'path=' + nodetools.urlEncode(path);

	return url;
};





lcdInfo.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions
	return defer.promise;
};

lcdInfo.prototype._searchArtists = function (results) {

};

lcdInfo.prototype._searchAlbums = function (results) {

};

lcdInfo.prototype._searchPlaylists = function (results) {


};

lcdInfo.prototype._searchTracks = function (results) {

};

lcdInfo.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

    // Handle go to artist and go to album function
    return defer.promise;
};
