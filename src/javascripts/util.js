var GAT = GAT || {Models: {}, Views: {}, Collections: {}, Routers: {}};
var util = util || {};
(function(app, util, $) {
	/*
	 * Stock functions
	 */
	util.loading = function(set) {
		$("body").toggleClass("loading", set);
	};
	
	util.serializeObject = function(obj) {
		var o = {};
		var a = obj.serializeArray();
		$.each(a, function() {
			if (o[this.name]) {
				if (!o[this.name].push) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
	};
	
	util.upload = function(file, success, error) {
		if( ! file || ! file.type.match(/image.*/)) return;
		var fd = new FormData();
		fd.append("image", file);
		fd.append("key", "17ddcab1bc7de79688829dd46696cb44");
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://api.imgur.com/2/upload.json");
		xhr.onload = function() {
			success(JSON.parse(xhr.responseText));
		};
		xhr.onerror = function() {
			error(JSON.parse(xhr.responseText));
		};
		xhr.send(fd);
	};
	
	/*
	 * ISO8601 Date Parser
	 * http://anentropic.wordpress.com/2009/06/25/javascript-iso8601-parser-and-pretty-dates/
	 */
	util.parseISO8601 = function(str) {
		var parts = str.split('T'),
		dateParts = parts[0].split('-'),
		timeParts = parts[1].split('Z'),
		timeSubParts = timeParts[0].split(':'),
		timeSecParts = timeSubParts[2].split('.'),
		timeHours = Number(timeSubParts[0]),
		_date = new Date;

		_date.setUTCFullYear(Number(dateParts[0]));
		_date.setUTCMonth(Number(dateParts[1])-1);
		_date.setUTCDate(Number(dateParts[2]));
		_date.setUTCHours(Number(timeHours));
		_date.setUTCMinutes(Number(timeSubParts[1]));
		_date.setUTCSeconds(Number(timeSecParts[0]));
		if (timeSecParts[1]) _date.setUTCMilliseconds(Number(timeSecParts[1]));

		return _date;
	}
	
	util.friendlyDate = function(date, showTime) {
		var friendly = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
		if(showTime) friendly += " " + date.getHours() + ":" + date.getMinutes();
		return friendly;
	}
	
	util.navigate = function(path, direction, silent) {
		app.router.navigate(path, {trigger: (!silent)});
		/*Jr.Navigator.navigate(path || "", {
			trigger: (!silent)
			,animation: {
				type: Jr.Navigator.animations.SLIDE_STACK
				,direction: direction == "right" ? Jr.Navigator.directions.RIGHT : Jr.Navigator.directions.LEFT
			}
		});*/
	}
	/**
	 * Hide Address Bar
	 * http://mobile.tutsplus.com/tutorials/mobile-web-apps/remove-address-bar/
	 */
	util.hideAddressBar = function() {
		if(document.height < window.outerHeight) {
			document.body.style.height = (window.outerHeight + 50) + 'px';
		}
		setTimeout( function(){ window.scrollTo(0, 1); }, 50 );
	}
})(GAT, util, Zepto);