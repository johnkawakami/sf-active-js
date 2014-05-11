
// our namespace
var IMC = {};

IMC.activate = function () {
	var arrow = $('#arrow');
	if ( $(document).scrollTop() > 200 ) {
		if ( arrow.css("display")=="none" ) {
			arrow.fadeTo( "slow", 0.7 );
		}
	} else {
		if ( arrow.css("display")!="none" ) {
			arrow.fadeOut("slow");
		}
	}
};
IMC.scrollUp = function () {
	var d = $(document);
	var start = d.scrollTop();
	var end = 0;
  var divs = 20;
	var divsquared = divs * divs;
	var delta = ( start - end);
	var i;
	for( i = 0; i < divs; i++ ) {
		pos = i * i * delta / (divsquared) ;
		window.setTimeout( new Function("{$(document).scrollTop("+(pos)+")}"), (divs-i)*20 );
	}
};

var layoutModule = function ($, EV) {
	// module globals
	var spinnerCounter = 0;
	var breakingnewsCache = null;
	var featureCache = null;
	var localCache = null;
	var fontsize=1; 
  var color=1;
	var font=1;

	// display switcher
	// fixme - need a global view switcher that will hide all, then reveal one
	var views = { 
			'thum':['#thumbscreen', 'LA Indymedia'],
			'loca':['#local', 'Local News'],
			'brea':['#breakingnews', 'Breaking News'],
			'feat':['#feature', 'Featured Stories'],
			'publ':['#publish', 'Publish'],
			'cale':['#calendar', 'Calendar'],
			'cont':['#content', 'LA Indymedia']
			};
	var displaySwitcher = function(view) {
		if (view==null || view=="") view='thum';
		for (var v in views) {
			if (v == view) {
				$(views[v][0]).css('display', 'block');
				$(document).attr('title', views[v][1]);
				$('#header-title').html(views[v][1]);
			} else {
				$(views[v][0]).css('display', 'none');
			}
		}
	};

	
  $(document).on({
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
							d.article["numcomments"] = d.comments.length;
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
		/*
		switch(values["_d"]) {
			case 's':
				// show the settings
				break;
		}
		*/
	};

	// -------------- HANDLERS ------------------------
	var discloseButtonHandler = function(id,ev) { console.log(id); }
	var replyButtonHandler = function(id,ev) { console.log(id); }
	var flagButtonHandler = function(id,ev) { console.log(id); }
	var shareButtonHandler = function(id,ev) { console.log(id); }
	var closeSettings = function() {
		$('#settingswrapper').fadeOut();
		$('#settings').slideUp();
		return false;
	}
	var openSettings = function() {
		$('#settingswrapper').fadeIn();
		$('#settings').slideDown();
		console.log( "color " + color );
		console.log( "fontsize " + fontsize );
		console.log( "font " + font );
		showSettings();
		$('#settingswrapper').on('click',closeSettings);
		return false;
	}
	var showSettings = function() {
	  var sets = ['black','white','small','medium','large','sans','serif'];
		$.map( sets, function(a,b) { $('#settings-'+a).removeClass('lit'); } );

		if (color==1) { $('#settings-white').addClass('lit'); }	
		if (color==2) { $('#settings-black').addClass('lit'); }	
		if (fontsize==1) { $('#settings-small').addClass('lit'); }	
		if (fontsize==2) { $('#settings-medium').addClass('lit'); }	
		if (fontsize==3) { $('#settings-large').addClass('lit'); }	
		if (font==1) { $('#settings-sans').addClass('lit'); }	
		if (font==2) { $('#settings-serif').addClass('lit'); }	
	}


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
		if (d.heading) { $('#heading').html(d.heading); }
		if (d.summary) { $('#summary').html(d.summary); }
		if (d.author) { $('#author').html('by '+d.author); }
		var article = $('#article');
		article.html('');
		if (d.media && d.media!="") {
			imgurl = /<img.+src="(.+?)".+?>/.exec(d.media)[1];
			article.append('<p class="media"><img class="photo" src="'+
			  imgurl+'"></p>');
		} else {
			imgre = /image/;
			if (imgre.test(d.mime_type)) { 
				article.append('<p class="media"><img style="min-width: 40%; max-width:100%" src="'+d.linked_file+'"></p>'); 
			}
		}
		article.append(d.article);
		if (d.link) { article.append('<p><a href="'+d.link+'">'+d.link+'</a></p>'); }

		$('<div/>', { class:'disc' }).append(
			a = $('<span/>', { class:'disc-btn', text: d.numcomments+' comment' }),
			b = $('<span/>', { class:'disc-btn', text:'reply' }),
			c = $('<span/>', { class:'disc-btn', text:'flag' }),
			e = $('<span/>', { class:'disc-btn', text:'like' }),
			f = $('<span/>', { class:'disc-btn', text:'share' })
		).appendTo( $(article) );
		a.click( function(x){ discloseButtonHandler(d.id,x); } );
		b.click( function(x){ replyButtonHandler(d.id,x); } );
		c.click( function(x){ flagButtonHandler(d.id,x); } );
		e.click( function(x){ flagButtonHandler(d.id,x); } );
		f.click( function(x){ shareButtonHandler(d.id,x); } );
	};

	var insertAttachments = function(d) {
		var att = $('#attachments');
		var i = 0;
		var template = '<div id="article-{{i}}" class="article"><h2>{{heading}}</h2><p class="byline">by {{{author}}}<br />{{{format_created}}}</p><p>{{{article}}}</p><p><a href="{{{linked_file}}}"><img src="{{{linked_file}}}" class="photo" /></a></p>';
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

				comment = $.parseHTML( text );
				// create some buttons
				$('<div/>', { class:'disc' }).append(
					a = $('<span/>', { class:'disc-btn', text:'flag' }),
					b = $('<span/>', { class:'disc-btn', text:'like' })
				).appendTo( $(comment) );
				a.click( function () { console.log('flag'); } );
				b.click( function () { console.log('like'); } );

				att.append( comment );
			}
		);
	};
	var insertComments = function(d) {
	  var commentTemplate = '<div id="article-{{i}}" class="comment"><h2>{{{heading}}}</h2><p>by {{{author}}}<br />{{{format_created}}}</p>{{{attachment}}}{{{article}}}<p><a href="{{{link}}}">{{{link}}}</a></p></div>';
	  var comm = $('#comments');
	  comm.html(''); // clear it out
	  for(var i=0;i<d.length;i++) {
		  var data = d[i];
			data.i = i;
			data.article = Encoder.htmlDecode(data.article);
			if (data.mime_type=='text/plain') {
				data.article = data.article.replace( /\n/mg, '<br />' );
			}
			if (/image/.test(data.mime_type)) {
				data.attachment = "<img src='"+data.linked_file+"' class='photo'>"
			}
			data.author = Encoder.htmlDecode(data.author);
			var text = Mustache.render(commentTemplate, data );
			text = EV.embedYouTube(text);

			comment = $.parseHTML( text );
			// create some buttons
			$('<div/>', { class:'disc' }).append(
				a = $('<span/>', { class:'disc-btn', text:'reply' }),
				b = $('<span/>', { class:'disc-btn', text:'flag' }),
				c = $('<span/>', { class:'disc-btn', text:'like' })
			).appendTo( $(comment) );
			a.click( function () { console.log('reply'); } );
			b.click( function () { console.log('flag'); } );
			c.click( function () { console.log('like'); } );

			comm.append( comment );
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
	// call this before using any styles
	var recoverCSS = function() {
		if (localStorage) {
			color = localStorage['imc-js.color'];
			if (!color) color=2;
			font = localStorage['imc-js.font'];
			if (!font) font=1;
			fontsize = localStorage['imc-js.fontsize'];
			if (!fontsize) fontsize=2;
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

	//-----INITIALIZE----------------
	//
	// attach actions to buttons
	$('#thumbscreenbutton').on('click',function(){History.back()});
	$('#blocal'   ).on('click',function(){History.pushState(null,"local","?v=loca")});
	$('#bbreaking').on('click',function(){History.pushState(null,"breaking news","?v=brea")});
	$('#bcalendar').on('click',function(){History.pushState(null,"calendar","?v=cale")});
	$('#bfeatures').on('click',function(){History.pushState(null,"features","?v=feat")});
	$('#bpublish' ).on('click',function(){History.pushState(null,"publish","?v=publ")});
	// settings form elements
	$('#settings-close').on('click',function(){return closeSettings();});
	$('#settings-open').on('click',function(){return openSettings();});
	$('#settings-small').on('click',function(){ fontsize=1; showSettings(); setCSS(); });
	$('#settings-medium').on('click',function(){ fontsize=2; showSettings(); setCSS(); });
	$('#settings-large').on('click',function(){ fontsize=3; showSettings(); setCSS(); });
	$('#settings-white').on('click',function(){ color=1; showSettings(); setCSS(); });
	$('#settings-black').on('click',function(){ color=2; showSettings(); setCSS(); });
	$('#settings-serif').on('click',function(){ font=2; showSettings(); setCSS(); });
	$('#settings-sans').on('click',function(){ font=1; showSettings(); setCSS(); });
	//$('#settings-open').on('click',function(){History.pushState(null,"settings",url.append("_d=s"))});
	//$('#settings-close').on('click',function(){History.popState()});

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
	/*
	new QRCode( document.getElementById('qrcode'), {
		text: window.location.href,
		width: 128,
		height: 128
	});
	*/
	$('#publish').append('publish');

	// load up headlines from the server
	var headlineLoader =	function(j) {
			console.log('loaded the headlines');
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
		};
	/* 
		Android 2.1 browser won't do callbacks, so you need to use
		the local proxy service.  Need to detect this exception and
		switch out the URL appropriately.
	*/
	/* 
	$.getJSON(
		'http://la.indymedia.org/js/ws/regen.php?callback=?',
		{ "s":"combined" },
		headlineLoader,
		function (j) {
			console.log("some kind of error happened");
		}
	);
	*/
	$.getJSON(
		getProxyUrl("http://la.indymedia.org/js/ws/regen.php?s=combined"),
		headlineLoader,
		function (j) {
			console.log("some kind of error happened");
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

/* 
	 This proxy url format is terrible. 
   It breaks using the back button to escape from dialog boxes.  A big
	 android issue.  The fix is that proxy url format needs to be more 
	 like this: /js/?id=12345&m=01&y=2013, or omit the m and y and just
	 generate the full url internally.  We can look for the real url in 
	 the json file.

	 Then, when we want to show settings, we change state and append _d=s
	 to the url: /js/?id=12345&_d=s

	 _d means "dialog box" and the value selects the box.

	 That way history.js can manage it.  

	 On our side, it complicates things - we have the 
	 DisplaySwitcher and DisplayFromQuery.  The DS manipulates
	 the DOM to show the right thing, and DFQ loads the data into
	 the layout.  We'd need to create ManageDialog that will 
	 display or hide dialog boxes.
*/
// converts a regular url into a url pulled by the local proxy script
var getProxyUrl = function(url) {
	if (document.location.href.match('indymedia.lo')||
		  document.location.href.match('192.168.111.4')) {
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
