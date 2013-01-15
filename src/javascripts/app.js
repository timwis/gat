var GAT = GAT || {Models: {}, Views: {}, Collections: {}, Routers: {}};
var util = util || {};
(function(app, util, $) {
	
	/**
	 * Config
	 */
	DEBUG = true;
	_.templateSettings.variable = "data";
	Parse.initialize(
		"mipDDGxaRmCMP6UiKKG423uRaHwJ98DA2MJjyqlo" // app id
		,"y2E1PVmBAjD3mqukUhxi8F5vk5JMIfOHMJwLc7X7" // javascript key
	);

	app.Views.LoginView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render", "onSubmit");
			this.template = $("#tmpl-login").html();
		}
		,render: function() {
			this.$el.html(this.template);
			return this;
		}
		,events: {
			"submit form": "onSubmit"
		}
		,onSubmit: function(e) {
			e.preventDefault();
			var username = this.$("[name='username']").val()
				,password = this.$("[name='password']").val();
			if(username && password) {
				util.loading(true);
				Parse.User.logIn(username, password, {
					success: function(user) {
						util.loading(false);
						util.navigate("", "left");
					}
					,error: function(user, error) {
						util.loading(false);
						alert("Invalid login");
					}
				});
			}
		}
	});

	app.Views.HomeView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render");
			this.template = _.template($("#tmpl-home").html());
			app.myOrders.on("change:numRecords", this.render);
		}
		,render: function() {
			this.$el.html(this.template({count: app.myOrders.numRecords || "?"}));
			return this;
		}
		,events: {
			"click .logout": "logout"
		}
		,logout: function(e) {
			//e.preventDefault();
			Parse.User.logOut();
			//util.navigate("login", "right");
		}
	});
	
	app.Models.Image = Backbone.Model.extend({
		defaults: {
			url: "http://api.imgur.com/2/upload.json"
			,key: "17ddcab1bc7de79688829dd46696cb44"
		}
		,sync: function(method, model, options) {
			var fd = new FormData()
				,xhr = new XMLHttpRequest();
			fd.append("image", model.get("image"));
			fd.append("key", model.get("key"));
			xhr.open("POST", model.get("url"));
			xhr.onload = function() {
				options.success(JSON.parse(xhr.responseText));
				if(model.collection) model.collection.trigger("uploaded");
			}
			xhr.onerror = function() {
				options.error(JSON.parse(xhr.responseText));
			}
			// Track progress
			var eventSource = xhr.upload || xhr
				,self = this;
			eventSource.addEventListener("progress", function(e) {
				var loaded = e.position || e.loaded
					,total = e.totalSize || e.total
					,percentage = Math.round(loaded * 100 / total);
				self.set("percentage", percentage);
				if(DEBUG) console.log(percentage + "%");
			});
			xhr.send(fd);
		}
		,parse: function(response) {
			this.set("hash", response.upload.image.hash);
			return this;
		}
	});
	
	app.Collections.Images = Backbone.Collection.extend({model: app.Models.Image});
	
	// TODO: Add ImageView that monitors change:progress on each image to update progress bar
	// but how do I submit the order when they're all complete?
	
	app.Models.Order = Parse.Object.extend("Order");
	
	app.Collections.Orders = Parse.Collection.extend({
		model: app.Models.Order
		,initialize: function(models, options) {
			_.bindAll(this, "getNumRecords");
			this.limit = options && options.limit ? options.limit : 5; // default limit
			this.skip = options && options.skip ? options.skip : 0;
			if(this.limit) this.query.limit(this.limit);
		}
		,query: new Parse.Query(app.Models.Order)
		,getNumRecords: function() {
			var self = this;
			this.query.count({
				success: function(count) {
					self.numRecords = count;
					self.trigger("change:numRecords");
				}
				,error: function(error) {
					if(DEBUG) console.log("Error Counting", error);
					self.numRecords = undefined;
					self.trigger("change:numRecords");
				}
			});
		}
		,nextPage: function() {
			this.skip += this.limit;
			this.query.skip(this.skip);
			return this;
		}
	});
	
	app.Collections.MyOrders = app.Collections.Orders.extend({
		query: (new Parse.Query(app.Models.Order)).equalTo("user", Parse.User.current()).descending("createdAt")
	});
	
	app.Views.MyOrdersView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render", "onClickMore", "onClickPrev");
			this.template = _.template($("#tmpl-my-orders").html());
			this.collection.on("reset", this.render);
			this.collection.on("add", this.render);
			this.collection.on("change:numRecords", this.render);
		}
		,render: function() {
			this.$el.html(this.template({orders: this.collection.toJSON(), numRecords: this.collection.numRecords || 0}));
			this.$("abbr.timeago").timeago();
			return this;
		}
		,events: {
			"click .more": "onClickMore"
			//,"click .button-prev": "onClickPrev"
		}
		,onClickMore: function(e) {
			e.preventDefault();
			this.collection.nextPage().fetch({add: true});
		}
		,onClickPrev: function(e) {
			e.preventDefault();
			util.navigate("", "right");
		}
	});
	
	app.Views.OrderView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render", "onClickPrev");
			this.template = _.template($("#tmpl-view-order").html());
			this.model.on("change", this.render);
		}
		,render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
		,events: {
			//"click .button-prev": "onClickPrev"
		}
		,onClickPrev: function(e) {
			e.preventDefault();
			util.navigate("my", "right"); // should go to home screen if newly created item
		}
	});

	app.Views.NewOrderView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "onAddFile", "onClickPrev", "onClickNext");
			this.template = _.template($("#tmpl-new-order").html());
		}
		,render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
		,events: {
			"click .button-prev": "onClickPrev"
			,"click .button-next": "onClickNext"
			,"change input[type='file']": "onAddFile"
			// remove image button
		}
		,onAddFile: function(e) { // TODO: What if they change the file?
			var newOrder = this.model;
			this.options.images.create(new app.Models.Image({image: e.target.files[0]}), {
				success: function(image) {
					console.log("Uploaded image", image);
					var currentPhotos = newOrder.get("photos") || [];
					newOrder.set("photos", currentPhotos.push(image.get("hash"))); // TODO
					if( ! newOrder.isNew()) newOrder.save(null, {patch: true}); // If order has already been saved, update it to have this photo
				}// TODO: error handling?
			});
		}
		,onClickPrev: function(e) {
			this.model.clear(); // Clear the model since we're essentially cancelling the order
		}
		,onClickNext: function(e) {
			var formData = util.serializeObject(this.$("form"));
			delete formData.photo;
			this.model.set(formData);
			var order = this.model;
			this.options.images.each(function(image) {
				image.save(null, {
					success: function(model) {
						console.log("Success", model);
						var currentPhotos = order.get("photos")
							,hash = model.get("hash");
						order.set("photos", currentPhotos ? currentPhotos.push(hash) : [hash]);
					}
				});
			});
		}
	});

	app.Views.AddressView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render", "onUserInput", "onKeyPress", "onAddressChanged", "onCoordsChanged", "onLoading", "onClickSubmit", "onClickPrev");
			this.template = $("#tmpl-address").html();
			this.options.mapView.on("mapmoved", this.options.geocoder.reverseGeocode);
			this.options.geocoder.on("change:address", this.onAddressChanged);
			this.options.geocoder.on("loading:start", this.onLoading, true);
			this.options.geocoder.on("loading:end", this.onLoading, false);
			this.options.geocoder.on("coordschanged", this.options.mapView.panTo); // Can I watch change:coords instead?
			this.options.geocoder.on("change:coords", this.onCoordsChanged);
			this.waiting = {};
			if(DEBUG) console.log(this.model.toJSON());
		}
		,render: function() {
			this.$el.html(this.template);
			this.$(".map-container").prepend(this.options.mapView.el);
			return this;
		}
		,events: {
			"change .address": "onUserInput"
			//,"keypress .address": "onKeyPress"
			,"click .submit": "onClickSubmit"
			,"submit form": "onUserInput" // Called if user hits enter on the address <input>
		}
		,onUserInput: function(e) {
			var input = this.$(".address").val();
			if(input) this.options.geocoder.geocode(input);
		}
		/*,onKeyPress: function(e) {
			if(e.keyCode === 13) this.onUserInput();
		}*/
		,onAddressChanged: function(geocoder) {
			this.$(".address").val(geocoder.get("address")); // Does this come through a param?
		}
		,onCoordsChanged: function(geocoder) {
			this.$("[name='latitude']").val(geocoder.get("coords").lat);
			this.$("[name='longitude']").val(geocoder.get("coords").lng);
		}
		,onLoading: function(set) {
			this.$(".address").toggleClass("loading", set);
		}
		,onClickSubmit: function(e) {
			e.preventDefault();
			var formData = util.serializeObject(this.$("form"))
				,newOrder = this.model;
				
			newOrder.set(formData); // Save address & lat/lng
			newOrder.set("user", Parse.User.current()); // Add user info to order
			if(DEBUG) console.log(newOrder.toJSON());
			util.loading(true); // Show loading indicator
			
			// Add newOrder to collection & push it to server via .create()
			app.myOrders.create(newOrder, {
				success: function(model) {
					if(DEBUG) console.log("Created order successfully", model);
					util.loading(false); // Hide loading indicator					
					// TODO: clear the new order so we can create a fresh one					
					util.navigate("view/" + model.id, "left"); // Navigate to the newly created order
				}
				,error: function(model, error) {
					util.loading(false);
					alert("Error saving");
					if(DEBUG) console.log("Error Saving", error, model);
				}
				,wait: true
			});
		}
		//,onSubmit: function(e) { e.preventDefault(); } // Don't submit form if the user hits enter on the address <input>
	});

	app.Views.UploadView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render", "onUploaded");
			this.template = _.template($("#tmpl-upload").html());
			app.images.on("uploaded", this.onUploaded);
		}
		,render: function() {
			this.$el.html(this.template({images: app.images}));
			return this;
		}
		,onUploaded: function() {
			//if(app.images.pluck("hash").indexOf(undefined) === -1)
		}
	});
	
	app.Routers.AppRouter = Jr.Router.extend({
		routes: {
			"": "home"
			,"login": "login"
			,"new": "newOrder"
			,"address": "address"
			,"upload": "upload"
			,"my": "myOrders"
			,"view/:id": "viewOrder"
			,"*path": "defaultRoute"
		}
		,initialize: function() {
			app.myOrders = app.myOrders || new app.Collections.MyOrders();
		}
		,before: {
			// Ensure user is logged in for every page except 'login'
			"[^login]": function() {
				if( ! Parse.User.current()) {
					this.navigate("login", {trigger: true, replace: true});
					return false;
				}
			}
			,"address": function() {
				if( ! app.newOrder) {
					this.navigate("new", {trigger: true, replace: true});
					return false;
				}
			}
			,"upload": function() {
				if( ! app.newOrder || ! app.images.length) {
					this.navigate("new", {trigger: true, replace: true});
					return false;
				}
			}
		}
		,home: function() {
			if(app.myOrders.numRecords === undefined) app.myOrders.getNumRecords();
			app.homeView = app.homeView || new app.Views.HomeView({});
			this.renderView(app.homeView);
		}
		,login: function() {
			app.loginView = app.loginView || new app.Views.LoginView();
			this.renderView(app.loginView);
		}
		,newOrder: function() {
			var images = new app.Collections.Images();
			app.newOrder = app.newOrder || new app.Models.Order();
			app.newOrderView = app.newOrderView || new app.Views.NewOrderView({
				model: app.newOrder
				,images: images
			});
			this.renderView(app.newOrderView);
		}
		,address: function() {
			app.geocoder = app.geocoder || new app.Models.Geocoder();
			app.addressView = app.addressView || new app.Views.AddressView({
				mapView: app.mapView
				,geocoder: app.geocoder
				,model: app.newOrder
			});
			this.renderView(app.addressView); // TODO: If you view this page, then leave, then come back, address is erased
			app.mapView.render(); // Must be done after element is created in DOM
		}
		,upload: function() {
			app.uploadView = app.uploadView || new app.Views.UploadView();
			this.renderView(app.uploadView);
		}
		,myOrders: function() {
			if(app.myOrders.numRecords === undefined) app.myOrders.getNumRecords();
			if( ! app.myOrders.length) app.myOrders.fetch();
			app.myOrdersView = app.myOrdersView || new app.Views.MyOrdersView({collection: app.myOrders});
			this.renderView(app.myOrdersView);
		}
		,viewOrder: function(id) {
			var order;
			if((order = app.myOrders.get(id))) {
				app.orderView = new app.Views.OrderView({model: order});
				this.renderView(app.orderView);
			} else {
				this.navigate("", {trigger: true, replace: true});
			}
		}
		,defaultRoute: function(path) {
			console.log("Error 404"); // TODO
		}
	});
	
	$(document).ready(function() {
		app.router = new app.Routers.AppRouter();
		Backbone.history.start();
		$("body").css("min-height", $(window).height()+60); // Remove address bar
	});
	
	/**
	 * Add animations to <a> that have data-anim set
	 * Idea from Tim Branyen's backbone-boilerplate
	 * https://github.com/tbranyen/backbone-boilerplate/blob/master/app/main.js#L22
	 */
	/*$(document).on(Modernizr.touch ? "touchend" : "click", "a[data-anim]", function(evt) {
		var href = $(this).attr("href")
			,anim = $(this).attr("data-anim");
		if(href.substr(0, 1) === "#") {
			evt.preventDefault();
			var opts = {trigger: true};
			Jr.Navigator.navigate(href || "", {
				trigger: true
				,animation: {
					type: Jr.Navigator.animations.SLIDE_STACK
					,direction: anim == "right" ? Jr.Navigator.directions.RIGHT : Jr.Navigator.directions.LEFT
				}
			});
			console.log("Anim " + anim);
		}
	});*/
	
	/**
	 * Executed Immediately
	 */
	app.mapView = new app.Views.MapView(); // So it will start locating
})(GAT, util, Zepto);