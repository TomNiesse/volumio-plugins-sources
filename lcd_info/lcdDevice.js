module.exports = lcdDevice

String.prototype.ljust = function( length, char ) {
    var fill = [];
    while(fill.length + this.length < length) {
        fill[fill.length] = char;
    }
    return this + fill.join('');
}

function lcdDevice(i2c_block_device, i2c_address) {
	this.i2c = require('i2c');
	//
	// LCD screen variables
	//
	this.LCD_I2C_BLOCK_DEVICE= i2c_block_device
	this.LCD_I2C_ADDRESS = i2c_address; // defaults to 0x3F
	this.LCD_WIDTH = 20;
	this.LCD_MODE_DATA    = 1;
	this.LCD_MODE_COMMAND = 0;
	this.LCD_ENABLE = 0x04;
	// Addresses for the different lines on the screen
	this.LCD_LINE_0 = 0x80;
	this.LCD_LINE_1 = 0xC0;
	this.LCD_LINE_2 = 0x94;
	this.LCD_LINE_3 = 0xD4;
	// Backlight controls
	this.LCD_BACKLIGHT  = 0x08; // 0x08 = ON, 0x00 = OFF
	// Delay time
	this.DELAY = 0.0005;

	// Initialize the display
	this.wire = new this.i2c(this.LCD_I2C_ADDRESS, {device: this.LCD_I2C_BLOCK_DEVICE});
}

lcdDevice.prototype.getWidth = function() {
    return this.LCD_WIDTH;
}

lcdDevice.prototype.sleep = function(ms) {
    var now = new Date().getTime();
    while(new Date().getTime() < now + ms){ /* Do nothing */ }
}

lcdDevice.prototype.toggle = function(bits) {
    this.sleep(this.DELAY);
    this.wire.writeByte(bits | this.LCD_ENABLE, function(err) {});
    this.sleep(this.DELAY);
    this.wire.writeByte(bits & ~this.LCD_ENABLE, function(err) {});
    this.sleep(this.DELAY);
}

lcdDevice.prototype.sendByte = function(bits, mode) {
    var bits_high = mode | (bits & 0xF0) | this.LCD_BACKLIGHT;
    var bits_low = mode | ((bits<<4) & 0xF0) | this.LCD_BACKLIGHT;

    this.wire.writeByte(bits_high, function(err) {});
    this.toggle(bits_high);
    this.sleep(this.DELAY);
    this.wire.writeByte(bits_low, function(err) {});
    this.toggle(bits_low);
}

lcdDevice.prototype.init = function() {
    this.sendByte(0x33,this.LCD_MODE_COMMAND); // 110011 Init
    this.sendByte(0x32,this.LCD_MODE_COMMAND); // 110010 init
    this.sendByte(0x06,this.LCD_MODE_COMMAND); // 000110 Cursor move
    this.sendByte(0x0C,this.LCD_MODE_COMMAND); // 001100 Display on, cursor off, blink off
    this.sendByte(0x28,this.LCD_MODE_COMMAND); // 101000 Data length, number of lines, font size
    this.sendByte(0x01,this.LCD_MODE_COMMAND); // Clear display
}

lcdDevice.prototype.clear = function() {
    this.displayString("", this.LCD_LINE_0);
    this.displayString("", this.LCD_LINE_1);
    this.displayString("", this.LCD_LINE_2);
    this.displayString("", this.LCD_LINE_3);
}

lcdDevice.prototype.displayString = function(message, line) {
    // If the line number is too high, skip
    if(line > 3) {
	return;
    }

    // Make sure there is a message at all
    if(message === null || typeof message === "undefined") {
        // Write an empty string to the LCD, since garbage was given
        this.displayString("", line);
        return;
    }

    // If the message is too long, cut it off
    if(message.length > 20) {
        message = message.substr(0, 20);
    }

    // Pad the message if it is too short
    message = message.ljust(this.LCD_WIDTH," ");

    // Set the right line
    switch(line) {
	case(0):
	    this.sendByte(this.LCD_LINE_0, this.LCD_MODE_COMMAND);
	    break;
        case(1):
            this.sendByte(this.LCD_LINE_1, this.LCD_MODE_COMMAND);
            break;
        case(2):
            this.sendByte(this.LCD_LINE_2, this.LCD_MODE_COMMAND);
            break;
        case(3):
            this.sendByte(this.LCD_LINE_3, this.LCD_MODE_COMMAND);
            break;
	default:
	    return;
    }
	
    // Remove accents from the message
    message = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Write all characters to the LCD screen
    for(var pos = 0; pos < this.LCD_WIDTH; pos++) {
        this.sendByte(message[pos].charCodeAt(0),this.LCD_MODE_DATA);
    }
}
