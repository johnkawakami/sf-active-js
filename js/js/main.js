
// our namespace
var IMC = {};

var layoutModule = function ($, EV) {
	// module globals
	var spinnerCounter = 0;
	var breakingnewsCache = null;
	var featureCache = null;
	var localCache = null;
  var color,font,fontsize; 

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
		if (view==null || view=="") view='thum';
		for (var v in views) {
			if (v == view) {
				$(views[v]).css('display', 'block');
			} else {
				$(views[v]).css('display', 'none');
			}
		}
	};

	
  $("body").on({
		ajaxStart: function() {
		  spinnerCounter++;
			$('#spinner').attr('src','images/spinner_black.gif');
		},
		ajaxStop: function() {
		  spinnerCounter--;
			if (spinnerCounter <= 0) {
				$('#spinner').attr('src','images/black.gif');
			}
		}
	});

	/** 
	 * state change hander - routes all the URLs to the correct screen 
	 * param 'v' picks a view
	 * param 'u' sets a url if needed
	 */
	var displayFromQuery = function () {
		var state = History.getState();
		var uri = new URI(state.url);	
		var values = URI.parseQuery(uri.query());

		switch(values.v) {
			case 'cont': 
				if (values.url) {
					clearContent();
					displaySwitcher(values.v);
					$.getJSON( getProxyUrl(values.url) ).done(
						function (d, error) {
							console.log("called loader");
							if (error!='success') alert(error);
							insertStory( d.article );
							insertAttachments( d.attachments );
							insertComments( d.comments );
						}
					); //done
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
	var clearContent = function() {
		$('#heading').html('');
		$('#summary').html('');
		$('#author').html('');
		$('#article').html('');
		$('#attachments').html('');
		$('#comments').html('');
	};
	var insertStory = function(d) {
		$('#heading').html(d.heading);
		$('#summary').html(d.summary);
		$('#author').html('by '+d.author);
		var article = $('#article');
		article.html('');
		if (d.media!="") article.append('<p class="media">'+d.media+'</p>');
		article.append(d.article);
		article.append('<p><a href="'+d.link+'">'+d.link+'</a></p>');
		article.append('<div class="reply-button"><a href="">reply</a></div>');
		article.append('<div class="report-button">+17<button>+</button>&nbsp; -2<button>-</button></div>');
	};
	var insertAttachments = function(d) {
		var att = $('#attachments');
		var i = 0;
		var template = '<div id="article-{{i}}"><h2>{{heading}}</h2><p class="byline">by {{{author}}}<br />{{{format_created}}}</p><p>{{{article}}}</p><p><a href="{{{linked_file}}}"><img src="{{{linked_file}}}" class="photo" /></a></p></div>';
		// if (d.length == 0) return; // bail out on empty
		att.html(''); // clear them
		d.forEach( 
				function (a) {
					++i;
					a.i = i;
					/* If the article contains a byline, it replaces the author field, and
					   the byline is deleted. */
					if ( a.article && ( matches = a.article.match( /^by (.*)$/m ) ) ) {
						a.author = matches[1];
						a.article = a.article.replace( /^by .*$/m, '' );
					}
					var text = Mustache.render( template, a );
					att.append( text );
				}
		);
	};
	var insertComments = function(d) {
	  var commentTemplate = '<div id="article-{{i}}"><h2>{{heading}}</h2><p>by {{{author}}}<br />{{{format_created}}}</p>{{{article}}}<p><a href="{{{link}}}">{{{link}}}</a></p></div>';
	  var comm = $('#comments');
	  comm.html(''); // clear it out
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
			comm.append( text );
	  }
	};

	// -----------SETTINGS--------------------------
	//
	// Swaps in different css files.  
	// For now, loads in the theme parts individually, but eventually, we will be constructing the
	// url from the cookie values of these different settings.  So they'll have names like 
	// theme-1-5-2.css.  There are potentialy dozens or hundreds of css files, each very short, like < 1k.
	// I should be using an ID attribute on the link tags. -fixme
	var setCSS = function() {
		var color, font, size;
		color = $('#color').val();
		font = $('#font').val();
		fontsize = $('#fontsize').val();
		console.log( " " + color + font + fontsize );
		var links = document.getElementsByTagName('link');
		links[1].href='css/src/color'+color+'.css';
		links[2].href='css/src/font'+font+'.css';
		links[3].href='css/src/fontsize'+fontsize+'.css';
		if (localStorage) {
			localStorage['imc-js.color'] = color;
			localStorage['imc-js.font'] = font;
			localStorage['imc-js.fontsize'] = fontsize;
		} else {
			var exdate = new Date();
			exdate.setDate(exdate.getDate() + 3600);
			document.cookie = 'format='+escape([color,font,fontsize].join(','))+"; expires="+exdate.toUTCString();
		}
	}
	// recover stylesheet values from localStorage or a cookie
	var recoverCSS = function() {
		if (localStorage) {
			color = localStorage['imc-js.color'];
			font = localStorage['imc-js.font'];
			fontsize = localStorage['imc-js.fontsize'];
		} else {
			var val = document.cookie;
			var cookies = val.split("; ");
			for(i=0;i<cookies.length;i++) {
				if ( cookies[i].indexOf("format") == 0 ) {
					var values = (cookies[i]).substr(7).split(',');
					color = values[0];
					font = values[1];
					fontsize = values[2];
				}
			}
		}
		var links = document.getElementsByTagName('link');
		if (color>0) {
			links[1].href='css/src/color'+color+'.css';
			$('#color').val(color);
		}
		if (font>0) {
			links[2].href='css/src/font'+font+'.css';
			$('#font').val(font);
		}
		if (fontsize>0) {
			links[3].href='css/src/fontsize'+fontsize+'.css';
			$('#fontsize').val(fontsize);
		}
	}
	var closeSettings = function() {
		$('#settingswrapper').fadeOut();
		$('#settings').slideUp();
		return false;
	}
	var openSettings = function() {
		$('#color').val(color);
		$('#font').val(font);
		$('#fontsize').val(fontsize);
		$('#settingswrapper').fadeIn();
		$('#settings').slideDown();
		return false;
	}

	//-----INITIALIZE----------------
	//
	// attach actions to buttons
	$('#thumbscreenbutton').on('click',function(){History.pushState(null,"thumbscreen","?v=thum")});
	$('#blocal'   ).on('click',function(){History.pushState(null,"local","?v=loca")});
	$('#bbreaking').on('click',function(){History.pushState(null,"breaking news","?v=brea")});
	$('#bcalendar').on('click',function(){History.pushState(null,"calendar","?v=cale")});
	$('#bfeatures').on('click',function(){History.pushState(null,"features","?v=feat")});
	$('#bpublish' ).on('click',function(){History.pushState(null,"publish","?v=publ")});
	// settings form elements
	$('#color').on('change', function(){setCSS();});
	$('#font').on('change', function(){setCSS();});
	$('#fontsize').on('change', function(){setCSS();});
	$('#settings-close').on('click',function(){return closeSettings();});
	$('#settings-open').on('click',function(){return openSettings();});

	// attach state handlers for history
  History.Adapter.bind(window, 'statechange', displayFromQuery);
  // for starters, call the handler
  displayFromQuery();

	// create a shortened url for the long url
	/*
	ferus = new FerusUrl( appkey );
	ferus.create( { 'url': window.location.href, 'size': 5, 'case': 'lower' } );
	*/

	// load up the bottom area
	new QRCode( document.getElementById('qrcode'), {
		text: window.location.href,
		width: 128,
		height: 128
	});
	$('#publish').append('publish');
    
	// load up headlines from the server
	$.getJSON(
		'http://la.indymedia.org/js/ws/regen.php?callback=?',
		{ "s":"combined" },
		function(j) {
			local = j["local"];
			feature = j["features"];
			calendar = j["calendar"];
			breakingnews = j["breakingnews"];

			localCache = formatArticleList( local );
			$('#local').append( localCache );
			attachArticleListClickHandler( local );

			breakingnewsCache = formatArticleList( breakingnews );
			$('#breakingnews').append( breakingnewsCache );
			attachArticleListClickHandler( breakingnews );

			calendarCache = formatCalendarList( calendar );
			$('#calendar').append( calendarCache );
			attachCalendarListClickHandler( calendar );

			featureCache = formatArticleList( feature );
			$('#feature').append( featureCache );
			attachArticleListClickHandler( feature );
		} 
	);

	// reload saved settings for CSS
	recoverCSS();

}; // end of the layout module

var attachArticleListClickHandler = function(articles) {
	for(var i=0; i < articles.length; i++) {
		var row = $('#id-'+articles[i].id);
		row.on('click',
			new Function('History.pushState(null,"local","?v=cont&url=http://la.indymedia.org'+articles[i].url+'")') 
			);
		row.html(row.contents().text()); // replaces link with title text
	}
}
var attachCalendarListClickHandler = function(articles) {
	for(var i=0; i < articles.length; i++) {
		var row = $('#id-'+articles[i].id);
		row.on('click',
			new Function('History.pushState(null,"local","?v=cont&url=http://indymedia.lo'+articles[i].url+'")') 
			);
		var link = $('#id-'+articles[i].id + " a");
		link.html(link.contents().text()); // replaces link with title text
	}
}
/**
 * json: an array of article link objects
 */
var formatArticleList = function(json) {
	if (json == null) {
		console.log("json is null");
		return;
	}
	  var html = '<ul class="articlelist">';
	  for(var i = 0; i < json.length ; i++) {
	  	j = json[i];
		html += '<li id="id-'+j.id+'" class="noselect"><a href="?v=cont&url=http://la.indymedia.org' 
		+ j.url
		+ '">'
		+ j.title
		+ '</a></li>';
	  }
	  html = html + '</ul>';	
	  return html;
};

var formatCalendarList = function(json) {
	if (json == null) {
		console.log("json is null");
		return;
	}
	  var html = '<ul class="articlelist">';
	  for(var i = 0; i < json.length ; i++) {
	  	j = json[i];
			html += '<li id="id-'+j.id+'" class="noselect"><a href="?v=cont&url=http://la.indymedia.org' 
			+ j.url
			+ '">'
			+ j.title
			+ '</a>'
			+ "<br />&nbsp;<span class='eventdate'>" + j.start 
			+ '</span></li>';
	  }
	  html = html + '</ul>';	
	  return html;
};

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

// converts a regular url into a url pulled by the local proxy script
var getProxyUrl = function(url) {
	if (document.location.href.match('indymedia.lo')) {
		return "/js/ws/proxy.php?url=" +  escape(url);
	} else {
		return url;
	}
};

//start of application
/* execute the page after the entire DOM is loaded */
function main($) {
	var uri = new URI( document.location.href );
	var search = uri.search(true);
	var url = search['url']; // means we want to view a specific url
	var v = search['v']; // means view
	if ( v ) {
		console.log('v specified, so doing nothing');
	} else	if (!url || url==='') {
		console.log("no  url specified, changing to thumb");
		History.replaceState(null, "thumbscreen", "?v=thum");
	} else {
		console.log("url set, assuming it's content");
		// url patterns are: - fixme
		// /news/year/month/id.json - articles
		// /events/year/id.json - calendar events
		// /features/year/id.json - features
		History.replaceState(null, "content", "/?v=cont&url=" + url);
	}
	var cache = search['cache'];
	if (cache=="1") {
		localStorage['rsstime'] = 0;
	}
	layoutModule($, EmbedVideo() );
}
jQuery(main);
