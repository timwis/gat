// This is the javascript file that is used to power the live example in the iphone on this [github page for the Junior HTML5 mobile framework](http://justspamjustin.github.com/junior/).
// Don't forget, that you need to include the necessary js and css dependencies
// that are listed on the main github page.  You will also need some initial scaffolding
// in the body of your HTML like this:
// <pre class="highlight">&lt;div id=<em class="s1">"app-container"</em>&gt;
//    &lt;div id=<em class="s1">"app-main"</em>&gt;
//    &lt;div&gt;
//&lt;div&gt;</pre>

// ## Defining Templates and Views

// ### HomeTemplate
//  This is just an array of strings.  However, you can use whatever
//  templating library that you want here.

var HomeTemplate = [
  // Put in a div with class content.  Ratchet will style this appropriately.
  '<div class="content">',
  ' <header class="junior-intro">',
  '   <h1 class="junior-name"><i class="icon-umbrella"></i> Junior</h1>',
  '   <p>A front-end framework for building html5 mobile apps with a native look and feel.</p>',
  ' </header>',
  // Another Ratchet component, a fancy list divider.
  ' <ul class="list divider-list"><li class="list-divider">Features</li></ul>',
  // In the view, we will use the flickable zepto plugin here, to animate this carousel.
  ' <div class="carousel-container">',
  '   <ul class="carousel-list">',
  '     <li class="carousel-item native-look-and-feel">',
  '       <summary>Transitions with a native look and feel.</summary>',
  '       <div class="feature-icon"></div>',
  '     </li>',
  '     <li class="carousel-item carousel-content">',
  '       <summary>Carousels using flickable.js</summary>',
  '       <i class="icon-picture"></i>',
  '     </li>',
  '     <li class="carousel-item backbone-content">',
  '       <summary>Integrated with Backbone.js</summary>',
  '       <div class="feature-icon"></div>',
  '     </li>',
  '   </ul>',
  // Add in these dots as a quick navigation for the carousel
  ' <div class="carousel-navigation-container">',
  '   <ul class="carousel-navigation"><li class="active" data-index="0"></li><li data-index="1"></li><li data-index="2"></li></ul>',
  ' </div>',
  ' </div>',
  // Use a ratchet button here
  ' <div class="button-positive button-block show-more-button">Show me more!</div>',
  '</div>'
  // Join the array with a new-line for a quick and easy html template.
].join('\n');

// ### HomeView
// A Jr.View works just like a Backbone.View, except whenever you attach a click event,
// if will check to see if you are on a touch device and if you are, attach a
// touchend event instead.

var HomeView = Jr.View.extend({
  // Simply render our HomeTemplate in the View's HTML
  render: function(){
    this.$el.html(HomeTemplate);
    this.afterRender();
    // Always return 'this' so Jr.Router can append your view to the body
    return this;
  },

  afterRender: function() {
    this.setUpCarousel();
  },

  setUpCarousel: function() {
    var after = function() {
      // Use the flickable plugin to setup our carousel with 3 segments
      this.$('.carousel-list').flickable({segments:3});
    };
    // We have to put this in a setTimeout so that it sets it up after the view is added to the DOM
    setTimeout(after,1);
  },

  events: {
    'click .show-more-button': 'onClickShowMoreButton',
    'onScroll .carousel-list': 'onScrollCarousel',
    'click .carousel-navigation li': 'onClickCarouselNavigationItem'
  },

  onClickShowMoreButton: function() {
    // Jr.Navigator works like Backbone.history.navigate, but it allows you to add an animation in the mix.
    Jr.Navigator.navigate('ratchet',{
      trigger: true,
      animation: {
        // Do a stacking animation and slide to the left.
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
    return false;
  },

  onScrollCarousel: function() {
    // Set the active dot when the user scrolls the carousel
    var index = this.$('.carousel-list').flickable('segment');
    this.$('.carousel-navigation li').removeClass('active');
    this.$('.carousel-navigation li[data-index="'+index+'"]').addClass('active');
  },

  onClickCarouselNavigationItem: function(e) {
    // Scroll the carousel when the user clicks on a dot.
    var index = $(e.currentTarget).attr('data-index');
    this.$('.carousel-list').flickable('segment',index);
  }

});

// ### RatchetTemplate
// This is just a template that shows different UI elements that you can use from the Ratchet project

var RatchetTemplate = [
  '<header class="bar-title">',
  ' <div class="header-animated">',
// If you want the contents of the header to be animated as well, put those elements inside a div
// with a 'header-animated' class.
  '   <div class="button-prev">Back</div>',
  '   <h1 class="title">Ratchet CSS</h1>',
  '   <div class="button-next">Next</div>',
  '</header>',
  '<div class="content ratchet-content">',
  ' <p>Jr. was inspired by Ratchet and pulls in their gorgeous styles.</p>',
  ' <p>Here are some examples:</p>',
  ' <div class="ratchet-examples">',
  '  <ul class="list inset">',
  '   <li>',
  '     <a href="#">',
  '       List item 1',
  '       <span class="chevron"></span>',
  '       <span class="count">4</span>',
  '     </a>',
  '   </li>',
  '  </ul>',
  '  <div class="button-block button-main">Block button</div>',
  '  <a class="button">Mini</a> <a class="button-main">buttons</a> <a class="button-positive">are</a> <a class="button-negative">awesome!</a>',
  '  <div class="toggle active example-toggle"><div class="toggle-handle"></div></div>',
  '  <div class="example-cnts"><span class="count">1</span><span class="count-main">2</span><span class="count-positive">3</span><span class="count-negative">4</span></div>',
  '  <input type="search" placeholder="Search">',
  ' </div>',
  ' <p>For more examples checkout the <a href="http://maker.github.com/ratchet/">ratchet project.</a></p>',
  '</div>'
].join('\n');

// ### RatchetView

var RatchetView = Jr.View.extend({
  render: function(){
    this.$el.html(RatchetTemplate);
    return this;
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
    'click .button-next': 'onClickButtonNext',
    'click .example-toggle': 'onClickExampleToggle'
  },

  onClickButtonPrev: function() {
    // Trigger the animation for the back button on the toolbar

    Jr.Navigator.navigate('home',{
      trigger: true,
      animation: {
        // This time slide to the right because we are going back
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.RIGHT
      }
    });
  },

  onClickButtonNext: function() {
    Jr.Navigator.navigate('pushstate',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
  },

  onClickExampleToggle: function() {
    // Simple example of how the on/off toggle switch works.
    this.$('.example-toggle').toggleClass('active');
  }
});

// ## PushStateTemplate
// Nothing new here

var PushStateTemplate = [
  '<header class="bar-title">',
  ' <div class="header-animated">',
  '   <div class="button-prev">Back</div>',
  '   <h1 class="title">Pushstate API</h1>',
  '</header>',
  '<div class="content pushstate-content">',
  '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam volutpat justo tortor. Curabitur posuere quam elit, quis fermentum sem. Pellentesque sed nibh id quam cursus convallis. Maecenas sit amet ipsum turpis, sit amet tristique est. Phasellus enim nisi, viverra ut laoreet in, facilisis a lectus. Duis dapibus commodo metus, quis viverra risus rhoncus ac. Donec pellentesque blandit tincidunt. In faucibus scelerisque risus, nec rhoncus turpis rhoncus quis. Etiam feugiat, libero vel iaculis fermentum, dolor diam volutpat mauris, non aliquam nisi leo vel nulla. Nulla lectus mi, condimentum in facilisis in, porta sit amet leo. Nullam imperdiet posuere ornare. Aenean velit mauris, laoreet at mollis sed, condimentum in dolor. Proin vel nunc risus, eu consequat nibh. Nunc euismod ipsum vel sem porta imperdiet. Aenean tempor, nulla nec tempus euismod, tellus justo feugiat massa, sed interdum nunc urna eget urna. Aliquam et elit quis elit luctus convallis in nec purus.<p>Cras sit amet leo dui. Mauris a ante felis. Pellentesque in pellentesque augue. Donec dolor urna, tempus nec elementum vel, faucibus id ipsum. Morbi ut nisl id ligula iaculis interdum sed porttitor odio. Vivamus purus augue, pulvinar ac facilisis bibendum, suscipit quis magna. Etiam ipsum augue, varius eu faucibus eget, hendrerit vitae ante. Donec et arcu tortor, a facilisis nisi. Sed quis tellus tortor. Nulla aliquet placerat odio, eget dignissim quam cursus ac.<p>Praesent eleifend eros eu tellus cursus ut euismod arcu tristique. Aenean hendrerit dignissim quam, nec euismod odio condimentum id. Pellentesque eget odio diam. Donec elementum leo pretium nulla pellentesque blandit pellentesque turpis eleifend. Duis id est augue. Maecenas quis tellus purus, lacinia vestibulum eros. Aliquam quis orci vel leo rutrum rutrum nec non erat. Suspendisse ac nulla ligula, at ornare velit. Suspendisse potenti. Integer eget enim id lacus tincidunt ultrices. Ut a ante arcu. Quisque id turpis augue, vel commodo nulla. Maecenas eget dui at erat consectetur bibendum. Nunc gravida viverra purus, in fringilla velit gravida consectetur. Quisque sagittis mattis euismod.<p>Donec hendrerit, erat nec elementum aliquet, erat libero auctor est, et dapibus elit nulla nec justo. Phasellus eget nulla vitae libero posuere convallis id eget orci. Integer tincidunt felis vitae quam iaculis et auctor metus molestie. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum et nulla eget sem dapibus eleifend. Cras in est id nulla vehicula congue sed ut massa. Nulla adipiscing facilisis nisi elementum varius. Nunc ac facilisis lorem. Quisque rhoncus scelerisque quam, ac cursus quam convallis in. Etiam et pulvinar nisl. Nunc commodo felis vitae magna placerat dapibus. Praesent dignissim eleifend gravida. Quisque aliquam condimentum quam sit amet auctor.<p>Etiam vulputate venenatis urna, eget ornare ante venenatis vel. Sed eu velit non mauris dictum lacinia eget in lacus. Maecenas scelerisque, enim sed ornare dictum, magna mi dapibus risus, ac tempus turpis ante eget dolor. Phasellus nunc sapien, pellentesque sed gravida sed, rhoncus sed ipsum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam dictum massa eu urna lobortis porta. Vivamus aliquam molestie tellus quis egestas. Phasellus ante justo, tempus eget posuere non, ultrices id augue. Donec blandit malesuada commodo. In hac habitasse platea dictumst.<p>Duis a metus elit, quis euismod nibh. Donec bibendum, enim tristique malesuada convallis, elit mi dictum nisl, ut ornare felis urna nec metus. Proin et vulputate nisl. Integer non nulla sem, at tempus neque. Mauris egestas bibendum lacus a pretium. Nam faucibus laoreet accumsan. Quisque nec dolor nibh. Fusce blandit lacinia sapien, vel tincidunt eros eleifend in. Mauris blandit arcu at diam tincidunt pretium. Donec dignissim dui sed mauris consequat eleifend consequat quis lectus. Ut at luctus nunc. Maecenas ultrices pharetra risus id consectetur.<p>Maecenas nec dignissim urna. Nulla tincidunt orci condimentum magna volutpat quis interdum nunc porta. Nulla tempor tellus id quam cursus quis lacinia risus scelerisque. In dictum eros sit amet sem ullamcorper sodales. Mauris tempus lectus nisl, quis auctor sem. Praesent scelerisque erat eros. Mauris at diam purus, a sollicitudin metus.<p>Mauris accumsan consequat erat quis commodo. Nunc nec risus purus. Proin ut odio vel elit fermentum pretium. Sed quis nibh vitae tortor auctor molestie eu vitae libero. Phasellus eget augue justo. Sed at quam ut sem bibendum lacinia. Sed ullamcorper tempor lorem. Suspendisse lacinia metus a tellus aliquam bibendum. Nunc tempus porttitor rhoncus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec venenatis justo eget mi blandit ac commodo lectus pulvinar.<p>Suspendisse potenti. Aenean nec erat mauris. Nam venenatis rutrum neque sit amet adipiscing. Vestibulum at mi nec neque condimentum laoreet ac in turpis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec adipiscing molestie sagittis. Curabitur iaculis, felis eget fringilla varius, est leo sollicitudin nisi, at laoreet purus lacus sed nisl. Vivamus a ligula eu nisl ultricies scelerisque.<p>Pellentesque sed suscipit nunc. Nulla tempor quam at nibh consequat sollicitudin. Nam ultricies leo ut nisi vehicula eleifend aliquam risus feugiat. Nulla pretium, nibh id mollis posuere, turpis libero interdum arcu, et egestas orci urna quis eros. In id nulla nunc, et ullamcorper nibh. Donec vel dui facilisis libero facilisis varius sed non erat. Fusce fermentum placerat volutpat. Pellentesque vehicula purus quis tellus convallis ultricies. Aenean sed ipsum augue, vitae varius velit. Aliquam viverra, diam eget sagittis ornare, lacus augue viverra orci, in cursus nibh dui non diam. Suspendisse pulvinar, magna non hendrerit elementum, lectus mi lobortis metus, et lobortis velit tortor vitae nibh. Nulla facilisi. Sed venenatis convallis tortor sed tristique. In quis ipsum in tortor lacinia iaculis vel eget elit. Nam laoreet ante cursus nibh ultricies pharetra. Sed eros augue, consectetur ac pellentesque at, hendrerit sit amet leo.<p>Nulla adipiscing suscipit sapien, ut egestas nisl elementum eu. Praesent eleifend lobortis sem. Sed quam lectus, feugiat in posuere id, auctor a libero. In vehicula laoreet eros, hendrerit lacinia metus vestibulum quis. Sed tristique sem vitae lectus tempus nec fringilla orci dapibus. Proin diam lorem, porta in congue in, bibendum ac nisl. Ut consectetur tellus sit amet mauris venenatis vestibulum. Sed elit urna, semper vitae lobortis a, fringilla vitae erat. Pellentesque laoreet dictum ante, vel ultricies lorem rhoncus ac. Duis pretium mi vitae eros sodales sed vulputate velit fermentum. Cras aliquet cursus lobortis. Duis blandit metus eleifend nisi aliquet condimentum.<p>Morbi pharetra facilisis sem, tincidunt dignissim orci tempor id. Donec nec turpis eget mi pharetra bibendum. Pellentesque at urna ac est faucibus gravida. Integer blandit suscipit semper. Cras quis tortor et mauris commodo consectetur. Proin bibendum lacinia lobortis. Fusce semper diam eu felis tincidunt aliquam. Phasellus vel venenatis nisi. Aliquam erat volutpat. Cras scelerisque rutrum mi sit amet aliquam. Suspendisse et purus quis nibh eleifend eleifend. Fusce in lorem auctor enim blandit adipiscing. Vivamus nunc nunc, tristique pharetra posuere et, viverra a leo. Ut id fringilla turpis.<p>Maecenas porta, dolor eu viverra luctus, mauris libero semper leo, quis tempor nibh metus et velit. Pellentesque aliquam suscipit libero ac elementum. Mauris tempor, turpis sit amet accumsan posuere, elit arcu molestie velit, sit amet sollicitudin erat tortor ac dolor. Praesent at massa et sem luctus laoreet. Duis tristique tempor ultrices. Cras at lobortis urna. Integer quis lacus urna, id aliquam felis. Nulla faucibus ullamcorper lorem non hendrerit. Integer eu nisl mi, vel viverra arcu. Duis ac nisl eget mi tincidunt lobortis.<p>Nam non est ullamcorper sem sollicitudin lacinia eget quis orci. Vestibulum mattis placerat eros, eget aliquam metus suscipit at. Suspendisse potenti. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla vitae sem in magna sodales iaculis vel et magna. Suspendisse quis malesuada massa. Duis id massa vulputate felis vestibulum sollicitudin. Mauris aliquam magna in leo blandit blandit. Phasellus convallis ultricies odio, ac congue sem sagittis non.<p>Integer mattis consectetur pharetra. Integer egestas sollicitudin luctus. Aenean a interdum ipsum. Quisque pellentesque tempor tortor, eget feugiat nulla aliquet quis. Sed ut odio mi, a placerat velit. Nam lacus dolor, facilisis in tristique eu, sollicitudin at justo. Etiam ut porta odio. Donec tincidunt neque vel arcu aliquet euismod. Aenean vel felis at tellus mattis fringilla a non orci. Donec ac magna mi. Donec consectetur interdum turpis convallis molestie. Sed malesuada mollis mattis. Aliquam ac sapien sapien.',
  '</div> '
].join('\n');

// ## PushStateView

var PushStateView = Jr.View.extend({
  render: function() {
    this.$el.html(PushStateTemplate);
    return this;
  },

  events: {
    'click .button-prev': 'onClickButtonPrev'
  },

  onClickButtonPrev: function() {
    Jr.Navigator.navigate('ratchet',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.RIGHT
      }
    });
  }

});

//## Routing to your Views
// Jr.Router is just like a Backbone.Router except we provide a renderView
// that will automatically add the view to the dom and do the animation if
// one is specified.  It will also automatically handle doing an opposite animation
// if the back button is pressed.

var AppRouter = Jr.Router.extend({
  routes: {
    'home': 'home',
    'ratchet': 'ratchet',
    'pushstate': 'pushstate'
  },

  home: function(){
    var homeView = new HomeView();
    this.renderView(homeView);
  },

  ratchet: function() {
    var ratchetView = new RatchetView();
    this.renderView(ratchetView);
  },

  pushstate: function() {
    var pushStateView = new PushStateView();
    this.renderView(pushStateView);
  }

});

var appRouter = new AppRouter();
Backbone.history.start();
Jr.Navigator.navigate('home',{
  trigger: true
});
