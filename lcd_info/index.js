'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var request = require('request');
var lcdDevice = require('./lcdDevice');
var renderer = require('./renderer');

module.exports = lcdInfo;

function lcdInfo(context) {
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;

    this.lcd = new lcdDevice("/dev/i2c-1", 0x3F);
    this.lcd.init();
    this.renderer = new renderer(this.lcd);
    this.renderer.setScroll(true);
    this.renderer.setScrollSize(10);
    this.renderer.setScrollInterval(5);

    this.current_status = {}; // If the status doesn't change, don't update the LCD screen
}

lcdInfo.prototype.sleep_async = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

lcdInfo.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
        this.lcd.displayString("Volumio has started", 0);

    return libQ.resolve();
}

lcdInfo.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();

        this.lcd.displayString("Plugin has started", 1);
	this.lcd.sleep(1000);
//        this.wire = new i2c(LCD_I2C_ADDRESS, {device: self.config.get("i2c_block_device")});
        this.getState(); // start reading data from volumio

	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

lcdInfo.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    this.lcd.init();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

lcdInfo.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
    this.lcd.init();
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
            // Load the I2C settings
            uiconf.sections[0].content[0].value = self.config.get("i2c_device");
            uiconf.sections[0].content[1].value = self.config.get("i2c_address");

            // Lead the right select option
            uiconf.sections[1].content[0].value.value = parseInt(self.config.get("scroll_type")); // it's really value.value
            switch(parseInt(self.config.get("scroll_type"))) {
		case 1:
		    uiconf.sections[1].content[0].value.label = "None";
		    break;
                case 2:
                    uiconf.sections[1].content[0].value.label = "Scroll";
                    break;
            }

            // Load the optional scroll options
            uiconf.sections[1].content[1].value = parseInt(self.config.get("scroll_interval"));
            uiconf.sections[1].content[2].value = parseInt(self.config.get("scroll_size"));

            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

//    self.commandRouter.pushToastMessage('success', "Load settings", "Loaded all settings");

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

        if(data["i2c_device"].length && data["i2c_address"].length) {
            // Check if the input is a valid address
            self.config.set('i2c_address', data["i2c_address"]);
	    self.config.set("i2c_device", data["i2c_device"]);
            self.commandRouter.pushToastMessage("success", "Saved", "I2C settings have been saved");
        } else {
            self.commandRouter.pushToastMessage("error", "Empty input in configuration", "I2C settings have NOT been saved");
        }

        return defer.promise;
}

lcdInfo.prototype.saveDisplaySettings = function(data) {
        var self = this;
        var defer = libQ.defer();

        self.config.set('scroll_type', data["scroll_type"].value);

	var scroll_size = parseInt(data["scroll_size"]);
	var scroll_interval = parseInt(data["scroll_interval"]);

	if(scroll_size >= 0 && scroll_interval >= 0) {
		self.config.set("scroll_size", data["scroll_interval"]);
        	self.config.set("scroll_interval", data["scroll_interval"]);
		self.commandRouter.pushToastMessage("success", "Saved", "Display settings have been saved");
	} else {
		self.commandRouter.pushToastMessage("error", "Empty or invalid input in configuration", "Some display settings have NOT been saved");
	}

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
			if(body.service === "webradio") {
				if(body.album !== null && typeof body.album !== "undefined" && body.album.length <= 0 || body.title.includes(" - ")) {
					// split body.title into title and artist
					var tmp = body.title.split(" - ");
                                        var title = tmp[0];
					var artist = tmp[1];
					self.renderer.updateBuffer(title, 0);
                        		self.renderer.updateBuffer(artist, 1);
					self.renderer.updateBuffer(body.artist, 2); // for now
                        		//self.renderer.updateBuffer(body.status, 3);
				} else {
					self.renderer.updateBuffer(body.title, 0);
		                        self.renderer.updateBuffer(body.artist, 1);
        		                self.renderer.updateBuffer(body.album, 2);
        		                //self.renderer.updateBuffer(body.status, 3);
				}
			} else {
				self.renderer.updateBuffer(body.title, 0);
                                self.renderer.updateBuffer(body.artist, 1);
                                self.renderer.updateBuffer(body.album, 2);
				//self.renderer.updateBuffer(body.status, 3);
			}
		};
	});

	this.renderer.update();

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
