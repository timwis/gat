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
	
	app.Models.Imgur = Backbone.Model.extend({
		defaults: {
			url: "https://api.imgur.com/3/upload.json"
			//,key: "17ddcab1bc7de79688829dd46696cb44" // api v2
			,key: "0dc8fbf0e30c756"
		}
		,sync: function(method, model, options) {
			if(method === "create") {
				var fd = new FormData();
				fd.append("image", model.get("image"));
				console.log(model.get("image"));
				$.ajax({
					url: model.get("url")
					,data: fd
					,processData: false
					,contentType: false
					,headers: {"Authorization": "Client-ID " + model.get("key")}
					,type: "POST"
					,success: function(response) {
						if(DEBUG) console.log("Imgur Response", response);
						if(response.success) options.success(response);
						else options.error(response);
					}
					,error: options.error
				});
			}
		}
		,parse: function(response) {
			this.set("link", response.data.link);
			return this;
		}
	});
	
	app.Models.ParseFile = Backbone.Model.extend({
		defaults: {
			url: "https://api.parse.com/1/files/"
			,key: "qN54fHJiUrc42nnIOPKq60BAWhWISgABQMylC5Nw"
		}
		,sync: function(method, model, options) {
			if(method === "create") {
				var file = model.get("image");
				$.ajax({
					url: model.get("url") + file.name
					,data: file
					,processData: false
					,contentType: false
					,headers: {
						"X-Parse-Application-Id": Parse.applicationId
						,"X-Parse-REST-API-Key": model.get("key")
						,"Content-Type": file.type
					}
					,type: "POST"
					,success: options.success
					,error: options.error
				});
			}
		}
		,parse: function(response) {
			this.set("link", response.url);
			return this;
		}
	});
	
	app.Collections.Images = Backbone.Collection.extend({model: app.Models.Imgur});
		
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
			this.skip = this.models.length; // This probably wouldn't work if it weren't descending order because models can be added
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
			this.collection.on("add", this.onAdd, this);
			this.collection.on("change:numRecords", this.render);
		}
		,onAdd: function() { console.log("onAdd()"); this.render(); }
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

	app.Views.NewOrderDetailsView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "onAddFile", "onClickNext");
			this.template = _.template($("#tmpl-new-order").html());
		}
		,render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
		,events: {
			"click .button-next": "onClickNext"
			,"change input[type='file']": "onAddFile"
			// remove image button
		}
		,onAddFile: function(e) { // TODO: What if they change the file?
			var newOrder = this.model;
			this.options.images.create(new app.Models.Imgur({image: e.target.files[0]}), {
				success: function(image) {
					console.log("Uploaded image", image);
					var currentPhotos = newOrder.get("photos") || [];
					currentPhotos.push(image.get("link"));
					newOrder.set("photos", currentPhotos);
					if( ! newOrder.isNew()) newOrder.save(null, {patch: true}); // If order has already been saved, update it to have this photo
				}// TODO: error handling?
			});
		}
		,onClickNext: function(e) {
            e.preventDefault();
			var formData = util.serializeObject(this.$("form"));
			delete formData.photo;
            formData["hittype"] = this.$("[name='hittype'] .active a").eq(0).text() || null;
			this.model.set(formData);
            app.router.newOrderAddress();
		}
	});

	app.Views.NewOrderAddressView = Jr.View.extend({
		initialize: function() {
			_.bindAll(this, "render", "onClickPrev", "onUserInput", "onAddressChanged", "onCoordsChanged", "onLoading", "onClickSubmit", "onPressEnter");
			this.template = _.template($("#tmpl-address").html());
			this.options.mapView.on("mapmoved", this.options.geocoder.reverseGeocode);
			this.options.geocoder.on("change:address", this.onAddressChanged);
			this.options.geocoder.on("loading:start", this.onLoading, true);
			this.options.geocoder.on("loading:end", this.onLoading, false);
			this.options.geocoder.on("coordschanged", this.options.mapView.panTo); // Can I watch change:coords instead?
			this.options.geocoder.on("change:coords", this.onCoordsChanged);
			//this.waiting = {};
			//if(DEBUG) console.log(this.model.toJSON());
		}
		,render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$(".map-container").prepend(this.options.mapView.el); // TODO: Not reusable
			return this;
		}
		,events: {
            "click .button-prev": "onClickPrev"
			,"change .address": "onUserInput"
			,"click .submit": "onClickSubmit"
			,"submit form": "onPressEnter" // Called if user hits enter on the address <input>
		}
        ,onClickPrev: function(e) {
            e.preventDefault();
            this.saveForm(); // Save address/lat/lng to model
            app.router.newOrderDetails();
        }
		,onUserInput: function(e) {
			var input = this.$(".address").val();
			if(input) this.options.geocoder.geocode(input);
		}
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
        ,saveForm: function() {
            var formData = util.serializeObject(this.$("form"));
            this.model.set(formData);
        }
		,onClickSubmit: function(e) {
			e.preventDefault();
			this.saveForm(); // Save address/lat/lng to model
			if(DEBUG) console.log(this.model.toJSON());
			util.loading(true); // Show loading indicator
			
			// Add this.model to collection & push it to server via .create()
			app.myOrders.create(this.model, {
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
		,onPressEnter: function(e) {
			e.preventDefault(); // Don't submit form if the user hits enter on the address <input>
			this.onUserInput();
		}
	});
	
	app.Routers.AppRouter = Jr.Router.extend({
		routes: {
			"": "home"
			,"login": "login"
			,"new": "newOrder"
			,"my": "myOrders"
			,"view/:id": "viewOrder"
			,"*path": "defaultRoute"
		}
		,initialize: function() {
			app.myOrders = app.myOrders || new app.Collections.MyOrders();
			app.mapView = new app.Views.MapView(); // So it will start locating
		}
		,before: {
			// Ensure user is logged in for every page except 'login'
			"^(?!login$).*": function() {
				if( ! Parse.User.current()) {
					this.navigate("login", {trigger: true, replace: true});
					return false;
				}
			}
		}
		,home: function() {
			if(app.myOrders.numRecords === undefined) app.myOrders.getNumRecords();
			app.homeView = app.homeView || new app.Views.HomeView({});
			this.showView(app.homeView);
		}
		,login: function() {
			app.loginView = app.loginView || new app.Views.LoginView();
			this.showView(app.loginView);
		}
        ,newOrder: function() {
            var order = new app.Models.Order({user: Parse.User.current()});
            app.newOrderDetailsView = new app.Views.NewOrderDetailsView({
                model: order
                ,images: new app.Collections.Images()
            })
            app.newOrderAddressView = new app.Views.NewOrderAddressView({
                model: order
                ,geocoder: new app.Models.Geocoder()
                ,mapView: app.mapView // Maybe I don't need to pass this
            });
            this.newOrderDetails();
        }
        ,newOrderDetails: function() {
            this.showView(app.newOrderDetailsView);
        }
        ,newOrderAddress: function() {
            this.showView(app.newOrderAddressView);
            app.mapView.render(); // Must be done after element is created in DOM
        }
		,myOrders: function() {
			if(app.myOrders.numRecords === undefined) app.myOrders.getNumRecords();
			if( ! app.myOrders.length) app.myOrders.fetch(); // TODO: Doesn't get triggered if you started at #new and added one to the collection
			app.myOrdersView = app.myOrdersView || new app.Views.MyOrdersView({collection: app.myOrders});
			this.showView(app.myOrdersView);
		}
		,viewOrder: function(id) {
			var order;
			if((order = app.myOrders.get(id))) {
				app.orderView = new app.Views.OrderView({model: order});
				this.showView(app.orderView);
			} else {
				this.navigate("", {trigger: true, replace: true});
			}
		}
		,defaultRoute: function(path) {
			console.log("Error 404"); // TODO
		}
        ,showView: function(view) {
            if(this.currentView) {
                this.currentView.$el.detach(); // Detach it so we don't kill the events on the view
            }
            $("#app-main").empty().append(view.render().el);
            this.currentView = view;
        }
	});
	
	/**
	 * Executed Immediately
	 */
	app.router = new app.Routers.AppRouter();
	Backbone.history.start();
	$("body").css("min-height", $(window).height()+60); // Remove address bar
    
    // Segmented controller switcher
    $(".segmented-controller a").live("click", function(e) {
        e.preventDefault();
        $(this).parent().toggleClass("active").siblings().removeClass("active");
    })
	
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
	
})(GAT, util, jQuery);