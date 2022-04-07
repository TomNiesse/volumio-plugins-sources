var lcdDevice = require('./lcdDevice');

module.exports = renderer;

function renderer(lcd) {
	this.lcd = lcd;

	this.scroll_enabled = new Boolean(false);
	this.scroll_size = 0;
	this.scroll_interval = 1;	// in seconds

	this.buffer = new Array(4);
	this.buffer[0] = " ";
	this.buffer[1] = " ";
	this.buffer[2] = " ";
	this.buffer[3] = " ";

	this.scroll_position = new Array(4);
	this.scroll_position[0] = 0;
        this.scroll_position[1] = 0;
        this.scroll_position[2] = 0;
        this.scroll_position[3] = 0;

	this.autoScroll();
}

renderer.prototype.sleep_async = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

renderer.prototype.autoScroll = function() {
	var self = this;

	var scroll_interval = parseInt(this.scroll_interval);
	if(this.scroll_enabled === true && this.scroll_size > 0 && scroll_interval > 0) {
		self.scroll();
	} else {
		this.scroll_position[0] = 0;
                this.scroll_position[1] = 0;
                this.scroll_position[2] = 0;
                this.scroll_position[3] = 0;
	}

	this.sleep_async(this.scroll_interval * 1000).then(() => {
		self.autoScroll();
        });
}

renderer.prototype.setScroll = function(bool_new_value) {
	this.scroll_enabled = bool_new_value;
}

renderer.prototype.setScrollSize = function(new_value) {
	this.scroll_size = parseInt(new_value);
}

renderer.prototype.setScrollInterval = function(new_value) {
	this.scroll_interval = parseInt(new_value);
}

renderer.prototype.getScrollInterval = function() {
	return this.scroll_interval;
}

renderer.prototype.update = function() {
	// Update the display
	this.displayBuffer();

	// Scroll the text if desired
//	if(this.scroll_enabled === true && this.scroll_size > 0) {
//		this.scroll();
//	} else {
//		this.scroll_position[0] = 0;
//        	this.scroll_position[1] = 0;
//        	this.scroll_position[2] = 0;
//        	this.scroll_position[3] = 0;
//	}
}

renderer.prototype.updateBuffer = function(new_string, line) {
	if(line <= this.buffer.length-1 && new_string != this.buffer[line]) {
		this.buffer[line] = new_string;
		this.scroll_position[line] = 0;
	}
}

renderer.prototype.displayBuffer = function() {
	for(var line = 0; line < this.buffer.length; line++) {
		if(this.buffer[line] !== undefined && this.buffer[line] !== null) {
			this.lcd.displayString(this.buffer[line].substr(this.scroll_position[line], this.lcd.getWidth()), line);
		} else {
			this.lcd.displayString(" ", line);
		}
	}
}

renderer.prototype.scroll = function() {
	for(var line = 0; line < this.buffer.length; line++) {
		// Only start scrolling if the line of text is longer than the LCD display
		if(this.buffer[line] !== undefined && this.buffer[line] !== null && this.buffer[line].length > this.lcd.getWidth()) {
			// Did we already reach the end of the scroll? if yes, start from the beginning
			if(this.buffer[line].length - this.scroll_position[line] <= this.lcd.getWidth()) {
				this.scroll_position[line] = 0;
			// Scroll the text forward
			} else {
				this.scroll_position[line] += this.scroll_size;
			}
		}
	}
}

/*
var lcd = new lcdDevice("/dev/i2c-1", 0x3F);
lcd.init();
var renderer = new renderer(lcd);

renderer.updateBuffer("qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm", 0);
renderer.updateBuffer("qwertyuiopasdfghjklzxcvbnm", 1);
renderer.updateBuffer("line 3", 2);
renderer.updateBuffer("line 4", 3);

renderer.setScroll(true);
renderer.setScrollSize(10);

while(1) {
	renderer.update();
	renderer.displayBuffer();
	lcd.sleep(1000);
}
*/
/*
renderer.updateBuffer("qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm", 0);
renderer.updateBuffer("qwertyuiopasdfghjklzxcvbnm", 1);
renderer.updateBuffer("line 3", 2);
renderer.updateBuffer("line 4", 3);

while(1) {
//	renderer.updateBuffer("mnbvcxzlkjhgfdsapoiuytrewq", 0);
	renderer.displayBuffer();
//	lcd.sleep(1000);
//	renderer.scroll(20);
//	renderer.displayBuffer();
//	lcd.sleep(1000);

//	renderer.updateBuffer("new string", 0);
//	renderer.displayBuffer();
//	renderer.scroll(20);
//	renderer.displayBuffer();
//        lcd.sleep(1000);
}
*/
