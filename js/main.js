
// our namespace
var IMC = {};

var layoutModule = function ($, EV) {

	// display switcher
	// fixme - need a global view switcher that will hide all, then reveal one
	var views = { 
			'thum':'#thumbscreen',
			'loca':'#local',
			'brea':'#breakingnews',
			'feat':'#feature',
			'publ':'#publish',
			'cale':'#calendar',
			'cont':'#content'
			};
	var displaySwitcher = function(view) {
		var id = views[view];
		if (id==null) id='thum';
		for (var v in views) {
			if (v == view) {
				$(views[v]).css('display','block');
			} else {
				$(views[v]).css('display', 'none');
			}
		}
	};

	
	/** 
	 * state change hander - routes all the URLs to the correct screen 
	 * param 'v' picks a view
	 * param 'u' sets a url if needed
	 */
	var displayFromQuery = function () {
		var state = History.getState();
		var uri = new URI(state.url);	
		var values = URI.parseQuery(uri.query());
		console.log(values.v);
		switch(values.v) {
			case 'cont': 
				displaySwitcher(values.v);
				if (localStorage[values.url] != null) {
					var data = JSON.parse(localStorage[values.url]);
					insertStory( data.article );
					insertAttachments( data.attachments );
					insertComments( data.comments );				
				} else {
					$.getJSON( getProxyUrl(values.url) ).done(function (data) {
						localStorage[values.url] = JSON.stringify(data);
						insertStory( data.article );
						insertAttachments( data.attachments );
						insertComments( data.comments );
					});
				}
				break;				
			case 'loca':
			case 'brea':
			case 'feat':
			case 'publ':
			case 'cale':
				displaySwitcher(values.v);
				break;
			case 'thum':
			default:
				displaySwitcher(values.v);
			break;
		}
	};

    // utitiles to fill in the layout
	var insertStory = function(d) {
		$('#heading').append(d.heading);
		$('#summary').append(d.summary);
		$('#author').append('by '+d.author);
		var article = $('#article');
		if (d.media!="") article.append('<p class="media">'+d.media+'</p>');
		article.append(d.article);
		article.append('<p><a href="'+d.link+'">'+d.link+'</a></p>');
		
	};
	var insertAttachments = function(d) {
		var att = $('#attachments');
		var i = 0;
		var template = '<div id="article-{{i}}"><h2>{{heading}}</h2><p class="byline">by {{{author}}}</p><p><a href="{{{linked_file}}}"><img src="{{{linked_file}}}" class="photo" /></a></p></div>';
		// if (d.length == 0) return; // bail out on empty
		d.forEach( 
				function (a) {
					++i;
					a.i = i;
					var text = Mustache.render( template, a );
					att.append( text );
				}
		);
	};
	var insertComments = function(d) {
	  var commentTemplate = '<div id="article-{{i}}"><h2>{{heading}}</h2><p>by {{{author}}}</p>{{{article}}}<p><a href="{{{link}}}">{{{link}}}</a></p></div>';
		for(var i=0;i<d.length;i++) {
		  var data = d[i];
			data.i = i;
			data.article = Encoder.htmlDecode(data.article);
			if (data.mime_type=='text/plain') {
				data.article = data.article.replace( /\n/mg, '<br />' );
			}
			data.author = Encoder.htmlDecode(data.author);
			var text = Mustache.render(commentTemplate, data );
			text = EV.embedYouTube(text);
			$('#comments').append( text );
		}
	};
	// draw the calendar
	// draw a list of stuff (move the rss feed code here)
	// draw local
	// draw breaking news
	// draw features

	// decorate the top bar
	$('#topbar').append("<span class='menu' id='thumbscreenbutton'><img src='list.png' /></span>")
	$('#topbar').append("<span>la.indymedia.org</span>");
	var s = SettingsIconFactory($,'#topbar');
	s.drawWidget();
	$('#topbar').append("<span class='menu' id='breakingbutton'>breaking</span>");
	$('#topbar').append("<span class='menu' id='localbutton'>local</span>");
	$('#topbar').append("<span class='menu' id='calendarbutton'>calendar</span>");
	$('#topbar').append("<span class='menu' id='featuresbutton'>features</span>");
	$('#topbar').append("<span class='menu' id='publishbutton'><b>publish</b></span>");
	// load up the bottom area
	new QRCode( document.getElementById('qrcode'), window.location.href );

	// attach actions to buttons
    $('#thumbscreenbutton').on('click',function(){History.pushState(null,"thumbscreen","?v=thum")});
    $('#localbutton'   ).on('click',function(){History.pushState(null,"local","?v=loca")});
	$('#breakingbutton').on('click',function(){History.pushState(null,"breaking news","?v=brea")});
	$('#calendarbutton').on('click',function(){History.pushState(null,"calendar","?v=cale")});
	$('#featuresbutton').on('click',function(){History.pushState(null,"features","?v=feat")});
	$('#publishbutton' ).on('click',function(){History.pushState(null,"publish","?v=publ")});

	// attach state handlers for history
    History.Adapter.bind(window, 'statechange', displayFromQuery);
    // for starters, call the handler
    displayFromQuery();

    

	
	// load up the local rss feed
	var now = new Date();
	var rsstime = localStorage['rsstime'];
	if (rsstime == null || rsstime == 0 || rsstime > now.valueOf()+360000) {
		$.getFeed({
			url: 'proxy.php?url=http://la.indymedia.org/newswire.rss',
			success: function(feed) {
			  var html = '<ul>';
			  for(var i = 0; i < feed.items.length && i < 55; i++) {
						var item = feed.items[i];
						html += '<li><a href="?v=cont&url=' 
						+ item.link.replace('.php','.json')
						+ '">'
						+ item.title
						+ '</a></li>';
			  }
			  html = html + '</ul>';
			  $('#local').append(html);
			  localStorage['rss'] = html;
              localStorage['rsstime'] = now;
			} 
	    });
	} else {
		var html = localStorage['rss'];
		$('#local').append(html);
	}
	// load up features
	$('#feature').append('feature');
	// load up the calendar
	$('#calendar').append('calendar');
	// load up breaking news
	$('#breakingnews').append('breaking news');
	$('#publish').append('publish');
	$('#article').append('article');

}; // end of the layout module

// useful modules
var EmbedVideo = function() {
	/* finds plain youtube urls and turns them into embeds */
	var embedYouTube = function (s) {
		var ytre = /(http:\/\/www\.)*youtube.com\/watch\?v=([a-zA-Z]{4,16})/;
		var output = [];
		var i = 0;
		var found = s.match(ytre);
		if (found) {
			output[i++] = 
				'<iframe class="videoPlayer" width="420" height="315" src="http://www.youtube.com/embed/' + 
				found[2] + 
				'" frameborder="0" allowfullscreen></iframe>';
		}
		return s + output.join();
	};
	var embedDailyMotion = function (s) {
	};
	return {
		embedYouTube: embedYouTube,
		embedDailyMotion: embedDailyMotion
	};
};

var EmbedAudio = function() {
	return {
		
	};
};

/* not sure what pattern this is.  Similar to Revealing Module, but it instantiates a new set of functions
 * with each call.  So it's really like a constructor function.  This style is wasteful if it's used >1 time
 * because all the functions are instantiated anew each time.
 */
/** draw and respond to the settings icon */
var SettingsIconFactory = function($,id) {
	var x, y, direction;
	var settings = {};
	var drawWidget = function() {
		$(id).append('<span class="icons"><img id="'+id.substr(1)+'-settings" src="gear.png" align="absmiddle" /></span>');
		// attach handler to it
		$(id+"-settings").on("click", drawDialog);
		// discover the x and y position of the widget
	};
	var drawDialog = function() {
		localStorage['rsstime'] = 0;
		alert("drawDialog " + id);
	};
	var handlers = function() {
	};
	var save = function(d) {
	};
	var close = function() {
	};
	var eraseWidget = function() {
	};
	return {
		settings: settings,
		drawWidget: drawWidget,
		eraseWidget: eraseWidget
	};
};

// converts a regular url into a url pulled by the local proxy script
var getProxyUrl = function(url) {
	return "/js/proxy.php?url=" +  escape(url);
};

//start of application
/* execute the page after the entire DOM is loaded */
function main($) {
	var uri = new URI( document.location.href );
	var search = uri.search(true);
	var url = search['url'];
	var v = search['v'];
	if ( v ) {
		console.log('v specified, so doing nothing');
	} else	if (!url || url==='') {
		console.log("no  url specified, changing to thumb");
		History.replaceState(null, "thumbscreen", "?v=thum");
	} else {
		console.log("url set, assuming it's content");
		History.replaceState(null, "content", "/?v=cont&url=" + url);
	}
	var cache = search['cache'];
	if (cache=="1") {
		localStorage['rsstime'] = 0;
	}
	layoutModule($, EmbedVideo() );
}
jQuery(main);
