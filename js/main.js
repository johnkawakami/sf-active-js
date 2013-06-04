

var layoutModule = function ($, EV, url) {

	$('#topbar').prepend("<span>la.indymedia.org</span>");
	var s = SettingsIconFactory($,'#topbar');
	s.drawWidget();
	
	$('#topbar').append("<span class='menu'>breaking<img src='list.png' align='absmiddle' /></span>");
	$('#topbar').append("<span class='menu' id='localbutton'>local</span>");
	$('#topbar').append("<span class='menu'>calendar</span>");
	$('#topbar').append("<span class='menu'>features</span>");
	$('#topbar').append("<span class='menu'><b>publish</b></span>");
	new QRCode( document.getElementById('qrcode'), window.location.href );

	var displayLocal = function() {
		$('#content').css('display','none');
		$('#local').css('display','block');
		$('#localbutton').on('click',hideLocal);
	};
	var hideLocal = function() {
		$('#content').css('display','block');
		$('#local').css('display','none');
		$('#localbutton').on('click',displayLocal);
	};

	var now = new Date();
	var rsstime = localStorage['rsstime'];
	if (rsstime == null || rsstime == 0 || rsstime > now.valueOf()+360000) {
		$.getFeed({
			url: 'proxy.php?url=http://la.indymedia.org/newswire.rss',
			success: function(feed) {
			  var html = '<ul>';
			  for(var i = 0; i < feed.items.length && i < 55; i++) {
						var item = feed.items[i];
						html += '<li><a href="?url=' 
						+ item.link.replace('.php','.json')
						+ '">'
						+ item.title
						+ '</a></li>';
			  }
			  html = html + '</ul>';
			  $('#local').append(html);
			  $('#localbutton').on('click',displayLocal);
			  localStorage['rss'] = html;
              localStorage['rsstime'] = now;
			} 
	    });
	} else {
		var html = localStorage['rss'];
		$('#local').append(html);
  	    $('#localbutton').on('click',displayLocal);
	}

	if (url!="") {
		$.getJSON(url).done(function (data) {
			insertStory( data.article );
			insertAttachments( data.attachments );
			insertComments( data.comments );
		});
	} else {
	}

	var insertStory = function(d) {
		$('#heading').append(d.heading);
		$('#summary').append(d.summary);
		$('#author').append('by '+d.author);
		var article = $('#article');
		if (d.media!="") article.append(d.media);
		article.append(d.article);
		article.append('<p><a href="'+d.link+'">'+d.link+'</a></p>');
		
	};
	var insertAttachments = function(d) {
		var att = $('#attachments');
		var i = 0;
		var template = '<div id="article-{{i}}"><h2>{{heading}}</h2><p>by {{{author}}}</p><p><a href="{{{linked_file}}}"><img src="{{{linked_file}}}" /></a></p></div>';
		// if (d.length == 0) return; // bail out on empty
		d.forEach( 
				function (a) {
					++i;
					var text = Mustache.render( template, a );
					att.append( text );
					console.log( i );
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
};

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
	  localStorage['rsstime']=0;
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

var uri = new URI( document.location.href );
var search = uri.search(true);
var url = search['url'];
if (!url || url==='') document.location.href='urlhelp.html';
var cache = search['cache'];

var getProxyUrl = function(url) {
	return "/js/proxy.php?url=" +  escape(url);
};

/* execute the page */
function main($) {
	if (cache=="1") {
		localStorage['rsstime'] = 0;
	}
	layoutModule($, EmbedVideo(), getProxyUrl(url) );
}
jQuery(main);
