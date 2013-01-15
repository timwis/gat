var GAT = GAT || {Models: {}, Views: {}, Collections: {}, Routers: {}};
var util = util || {};
(function(app, util) {
    
	app.Views.MapView = Backbone.View.extend({
		defaults: {
			latitude: 39.9522
			,longitude: -75.1642
			,zoom: 16
			,baseMapUrl: "http://{s}.tile.cloudmade.com/b3151979a2e44ef28badec6ef9313327/22677/256/{z}/{x}/{y}.png"
			,baseMapMaxZoom: 18
			,maximumAge: 60000
			,desiredAccuracy: 10
			,minAccuracy: 900 // Anything above this, don't display the geomarker
			,imgGeomarkerUrl: "./img/blue_dot.png"
			,imgGeomarkerSize: [10, 10]
			,geocodeInterval: 250
		}
		
		,className: "map"
		
		,initialize: function() {
			_.bindAll(this, "render", "onLocationFound", "renderGeolocation", "onMapMoved", "panTo");
			this.options = !_.isEmpty(this.options) ? _.defaults(this.options, this.defaults) : this.defaults;
			this.map = new L.Map(this.el);
			this.map.locate({
				maximumAge: this.options.maximumAge
				,enableHighAccuracy: true
				,watch: true
			});
			this.map.on("locationfound", this.onLocationFound);
			this.map.on("moveend", this.onMapMoved);
			this.geolocation = {};
			this.lastGeocode = {};
		}
		
		,render: function() {
			if(this.baseMap === undefined) { // Only do this if it hasn't been rendered already
				// If we have a GPS location, use that; otherwise, use the default latlng
				var latlng = this.geolocation.latlng !== undefined ? this.geolocation.latlng : [this.options.latitude, this.options.longitude];
				this.map.setView(latlng, this.options.zoom);
				this.baseMap = L.tileLayer(this.options.baseMapUrl, {maxZoom: this.options.baseMapMaxZoom});
				this.baseMap.addTo(this.map);
				this.renderGeolocation();
			}
			return this;
		}
		
		// Store the latest GPS location, check if we should stop watching the GPS, and trigger events
		,onLocationFound: function(e) {
			this.geolocation.latlng = e.latlng;
			this.geolocation.accuracy = e.accuracy;
			this.trigger("locationfound", this.geolocation); // Trigger on the view so other Backbone objects can bind to the event
			if(DEBUG) console.log("locationfound");
			
			// If the map has already been rendered, render the geolocation
			if(this.baseMap !== undefined) this.renderGeolocation();
			
			// If this location meets our desired accuracy, stop trying to get a better location
			if(this.geolocation.accuracy <= this.options.desiredAccuracy) {
				this.map.stopLocate();
				this.trigger("desiredaccuracyfound", this.geolocation);
				if(DEBUG) console.log("desiredaccuracyfound");
			}
		}
		
		// Render dot with circle, denoting user's gps location
		,renderGeolocation: function() {
			if(this.geolocation.latlng !== undefined && this.geolocation.accuracy !== undefined) {
				var radius = this.geolocation.accuracy / 2;
				if(radius <= this.options.minAccuracy) {
					// Move marker if it exists, otherwise create it
					if(this.geolocation.marker) {
						this.geolocation.marker.setLatLng(this.geolocation.latlng);
					} else {
						var icon = L.icon({iconUrl: this.options.imgGeomarkerUrl, iconSize: this.options.imgGeomarkerSize});
						this.geolocation.marker = L.marker(this.geolocation.latlng, {icon: icon, clickable: false}).addTo(this.map);
					}
					// Move/resize circle if it exists, otherwise create it
					if(this.geolocation.circle) {
						this.geolocation.circle.setLatLng(this.geolocation.latlng).setRadius(radius);
					} else {
						var circleOptions = {
							fillOpacity: 0.1
							,opacity: 0.2
							,weight: 3
							,clickable: false
						};
						this.geolocation.circle = L.circle(this.geolocation.latlng, radius, circleOptions).addTo(this.map);
					}
				} // TODO: else if marker/circle already exists, delete them
			}
		}
		
		,onMapMoved: function() {
			this.trigger("mapmoved", this.map.getCenter());
		}
		
		,panTo: function(coords) {
			this.map.panTo(coords);
		}
	});
	
	app.Models.Geocoder = Backbone.Model.extend({
		defaults: {
			cityState: "Philadelphia, PA"
		}
		,initialize: function() {
			_.bindAll(this, "reverseGeocode", "geocode");
			this.utility = new google.maps.Geocoder(); // Call it utility because calling it geocoder is just too confusing with the name of this object
		}
		,reverseGeocode: function(coords) {
			this.set({address: null, coords: coords});
			this.fetch({coords: coords});
		}
		,geocode: function(address) {
			this.set("coords", {});
			this.fetch({address: address});
		}
		,sync: function(method, model, options) {
			if(method === "read" && (options.coords !== undefined || options.address !== undefined)) {
				var params, getCoords;
				if(options.coords !== undefined) {
					params = {latLng: new google.maps.LatLng(options.coords.lat, options.coords.lng)};
				} else if(options.address !== undefined) {
					params = {address: options.address + ", " + this.get("cityState")};
					getCoords = true;
				}
				this.trigger("loading:start");
				var self = this;
				this.utility.geocode(params, function(results, status) {
					self.trigger("loading:end");
					options.success({
						results: results
						,status: status
						,getCoords: getCoords
					});
				});
			}
		}
		,parse: function(response) {
			var data= {};
			if(response.status === "OK" && response.results.length) {
				var result = this.getGeocodeType(response.results, "street_address");
				if(result) {
					var addressParts = [];
					addressParts.push(result.address_components[0].long_name);
					addressParts.push(result.address_components[1].long_name);
					data.address = addressParts.join(" ");
					
					// If we want to get the coords out of the data (for a geocode, not reverse)
					if(response.getCoords) {
						data.coords = {}; // This will be returned to change the model's coords, for rendering in the form
						data.coords.lat = result.geometry.location.lat();
						data.coords.lng = result.geometry.location.lng();
						this.trigger("coordschanged", data.coords); // Trigger so the map can detect and move
					}
				}
			}
			return data;
		}
		,getGeocodeType: function(results, type) {
			var i, ii;
			for(i in results) {
				for(ii in results[i].types) {
					if(results[i].types[ii] === type) {
						return results[i];
					}
				}
			}
			return false;
		}
	});
})(GAT, util);