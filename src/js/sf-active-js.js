// this needs to be revised so it'll compile correctly.
// our namespace
var IMC = IMC || {};

IMC.arrow = function () {
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
IMC.activateArrow = function () {
	if (IMC.arrowPoller) {
		// do nothing
	} else {
		IMC.arrowPoller = window.setInterval( IMC.arrow, 500 );
	}
	$('#arrow').on( 'click', IMC.scrollUp );
};
IMC.deactivateArrow = function () {
	$('#arrow').fadeOut();
	if (IMC.arrowPoller) {
		window.clearInterval( IMC.arrowPoller );
		delete(IMC.arrowPoller);
	}
};
IMC.makeScrollUpFrame = function (pos) {
    return function() {
        $(document).scrollTop(pos);
    };
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
        window.setTimeout(IMC.makeScrollUpFrame(pos), (divs-i)*20);
	}
};
IMC.scrollDown = function () {
	var d = $(document);
	d.scrollTop(d.height());
};

//------ sharing library
IMC.share = {};
IMC.share.facebook = function(url, title) {
    return function() {
        window.open('http://www.facebook.com/sharer.php?u='+url+'&t='+encodeURIComponent(title));
    };
};
IMC.share.google = function(id) { 
    return function() {
        window.open('https://plus.google.com/share?url=http://la.indymedia.org/display.php?id='+id);
    };
};
IMC.share.twitter = function(id, title) { 
    return function() {
        window.open('http://www.twitter.com/share?text='+encodeURIComponent(title)+'&url=http://la.indymedia.org/display.php?id='+id);
    };
};
IMC.share.email = function(url, title) { 
    return function() {
        window.open('mailto:email@example.com?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(url));
    };
};

//------ commenting
IMC.getIdFromQuery = function() {
    var state = History.getState();
    var uri = new URI(state.url);	
    var values = URI.parseQuery(uri.query());
    var url = values.url;
    var parts = /\/([0-9]+)\.json$/.exec(url);
    var id = parts[1];
    return parseInt(id);
};
IMC.postComment = function( evt ) {
    evt.preventDefault(); 
    evt.stopPropagation(); 


	var subject = $('#comment-subject').val();
	var text = $('#comment-text').val();
	var author = $('#comment-author').val();

    if (subject==='' || text==='' || author==='') {
        alert("No empty fields allowed");
        return;
    }
    var csrf_token = $('#editor').attr('data-csrf-token');

    url = '/js/ws/post.php';
	data = {
        "csrf_token": csrf_token,
		"author": author,
		"subject": subject,
		"text": text,
        "parent_id": IMC.getIdFromQuery()
	};
    console.log(data);
	$.post( url, data,
		function(result) {
            // try to force a refresh
            location.reload();
            return false;
		}, 'json')
		.done( function() {
		})
		.fail( function() {
            alert("Post Failed!");
            return false;
		})
		.always( function() {
		});
	window.localStorage.scrollToBottom = 1;
};
IMC.hideCommentForm = function() {
	var editor = $('#editor');
    editor.hide(0);
    $('#disclose').html('&#9654; Add Comment');
};
IMC.toggleCommentForm = function() {
	var editor = $('#editor');
	if (editor.css('display')=='none') {
        editor.slideDown({
            duration: 500, 
            progress: IMC.scrollDown
        });
		$('#disclose').html('&#9660; Add Comment');
        $.get('/js/ws/csrf.php', function(result) {
            $('#editor').attr('data-csrf-token', result.csrf_token);
        }, 'json');
	} else {
        IMC.hideCommentForm();
	}
};
IMC.disableCommentDiscloser = function() {
    $('#editor').addClass('hidden');
    $('#disclose').addClass('hidden');
};
IMC.enableCommentDiscloser = function() {
    $('#disclose').removeClass('hidden');
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
			'comm':['#latestcomments', 'Latest Comments'],
			'cont':['#content', 'LA Indymedia']
			};
	var displaySwitcher = function(view) {
		if (view===null || view==="") view='thum';
		for (var v in views) {
			if (v == view) {
				$(views[v][0]).css('display', 'block');
				$(document).attr('title', views[v][1]);
				$('#header-title').html(views[v][1]);
                IMC.hideCommentForm();
                if (v=='cont' || v=='publ') {
                    IMC.enableCommentDiscloser();
                } else {
                    IMC.disableCommentDiscloser();
                }
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
	 * param 'url' sets a url if needed
     * fixme - doesn't work in mobile chrome.
	 */
	function displayFromQuery() {
		var state = History.getState();
		var uri = new URI(state.url);	
		var values = URI.parseQuery(uri.query());

        /*
        console.log('displayFromQuery');
        if (IMC.currentURL === values.url) {
            console.log('already here');
            return;
        }
        */
		switch(values.v) {
			case 'cont': 
				if (values.url) {
					clearContent();
					displaySwitcher(values.v);
                    $('#comment-author').val(undefined);
                    $('#comment-subject').val(undefined);
                    $('#comment-text').val(undefined);
					$.getJSON( getProxyUrl(values.url),
                    function (d) {
							d.article.numcomments = d.comments.length;
							insertStory( d.article );
							insertAttachments( d.attachments );
							insertComments( d.comments );
							if (window.localStorage.scrollToBottom==1) {
								window.localStorage.scrollToBottom = 0;
								IMC.scrollDown();
							}
							if (values.stb=='1') {
								IMC.scrollDown();
							}
                            IMC.currentURL = values.url;
						}
					) 
                    .fail(function(jqXHR, status, errorThrown) {
                        alert("There was an error. Try reloading the page.");
                    });
				}
				break;				
			case 'loca':
			case 'brea':
			case 'feat':
			case 'publ':
			case 'cale':
			case 'comm':
				displaySwitcher(values.v);
				break;
			case 'thum':
				displaySwitcher(values.v);
                break;
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
    function openDisclose(id,ev) { console.log(id); };
	function openReply(id,ev) { 
    };
	function openFlag(id,ev) { 
		var f = $('#flag');
		var ajaxSubmitFlag = function (id, reason) {
			return function() {
				$.getJSON( 'http://la.indymedia.org/qc/report.php?id='+id+'&q='+reason+'&format=json&callback=?',
					function( data ) {			
						if (data.moderatorScore) {
							alert( "Thank you.  Your mod score is " + data.moderatorScore );
						} else {
							alert( "Thank you for moderating." );
						}
						closeFlag();
					}
				)
				.fail(function(){ 
					alert("There was an error in moderation.  It has been logged.");
					closeFlag();
				});
			};
		};
		closeSettings();
		closeShare();
		IMC.deactivateArrow();
		$('#settingswrapper').fadeIn().on('click',closeFlag);
		$('#flag-fraud').click( ajaxSubmitFlag( id, 'fraud' ) );
		$('#flag-racist').click( ajaxSubmitFlag( id, 'racist' ) );
		$('#flag-genocide').click( ajaxSubmitFlag( id, 'genocide' ) );
		$('#flag-chatter').click( ajaxSubmitFlag( id, 'chatter' ) );
		$('#flag-double').click( ajaxSubmitFlag( id, 'double' ) );
		$('#flag-ad').click( ajaxSubmitFlag( id, 'ad' ) );
		$('#flag-porn').click( ajaxSubmitFlag( id, 'porn' ) );
		f.css('position','fixed').css('bottom','0').css('left','0');
		f.slideDown();
		return false;
    };
	function closeFlag() {
		IMC.activateArrow();
		$('#flag').fadeOut();
		$('#settingswrapper').fadeOut();
        $('#flag-fraud').off();
        $('#flag-racist').off();
        $('#flag-genocide').off();
        $('#flag-chatter').off();
        $('#flag-double').off();
        $('#flag-ad').off();
        $('#flag-porn').off();
		$('#flag').slideUp();
		return false;
    };
	function openShare(id, url, title, ev) { 
		var s = $('#share');
		$('#share-twitter').click( IMC.share.twitter( id, title ) );
		$('#share-facebook').click( IMC.share.facebook( url, title ) );
		$('#share-google').click( IMC.share.google( id ) );
		$('#share-email').click( IMC.share.email( url, title ) );
		closeSettings();
		closeFlag();
		IMC.deactivateArrow();
		$('#settingswrapper').fadeIn().on('click',closeShare);
		s.css('position','fixed').css('bottom','0').css('left','0');
		s.slideDown();
		return false;
    };
	function closeShare() {
		IMC.activateArrow();
		$('#share').fadeOut();
		$('#settingswrapper').fadeOut();
        $('#share-twitter').off();
        $('#share-facebook').off();
        $('#share-google').off();
        $('#share-email').off();
		$('#share').slideUp();
		return false;
    };
	function openSettings() {
		closeShare();
		closeFlag();
		IMC.deactivateArrow();
		$('#settingswrapper').fadeIn().on('click',closeSettings);
		$('#settings').slideDown();
		showSettings();
		return false;
    };
	function closeSettings() {
		$('#settingswrapper').fadeOut();
		$('#settings').slideUp();
		return false;
    };
	function showSettings() {
	  var sets = ['black','white','small','medium','large','sans','serif'];
		$.map( sets, function(a,b) { $('#settings-'+a).removeClass('lit'); } );

		if (color==1) { $('#settings-white').addClass('lit'); }	
		if (color==2) { $('#settings-black').addClass('lit'); }	
		if (fontsize==1) { $('#settings-small').addClass('lit'); }	
		if (fontsize==2) { $('#settings-medium').addClass('lit'); }	
		if (fontsize==3) { $('#settings-large').addClass('lit'); }	
		if (font==1) { $('#settings-sans').addClass('lit'); }	
		if (font==2) { $('#settings-serif').addClass('lit'); }	
    };


	// utitiles to fill in the layout
	function clearContent() {
		$('#topphoto').html('');
		$('#heading').html('');
		$('#summary').html('');
		$('#author').html('');
		$('#article').html('');
		$('#attachments').html('');
		$('#comments').html('');
	};
	function insertStory(d) {
        console.log('insertStory');
		if (d.heading) { $('#heading').html(d.heading); }
		if (d.summary) { $('#summary').html(d.summary); }
		if (d.author) { $('#author').html('by '+d.author); }
		var article = $('#article');
		article.html('');
		if (/audio/.test(d.mime_type)) {
			article.append('<p><audio controls><source src="'+d.fileurl+'" type="'+d.mime_type+'"></audio></p>');
		} else if (/image/.test(d.mime_type)) {
            if (d.image) {
                var img = d.image.medium || d.image.original;
                $('#topphoto').append('<p class="media"><img class="photo" src="'+
                  img+'"></p>');
            } else {
                $('#topphoto').append('<p class="media"><img class="photo" src="'+
                  d.linked_file+'"></p>');
            }
		} else {
		}
		article.append(d.article);
		if (d.link) { article.append('<p><a href="'+d.link+'">'+d.link+'</a></p>'); }

		$('<div/>', { class:'disc' }).append(
			//a = $('<span/>', { class:'disc-btn', text: d.numcomments+' comment' }),
			b = $('<span/>', { class:'disc-btn', text:'reply' }),
			c = $('<span/>', { class:'disc-btn', html:'<span class="icon flagbutton"></span>' }),
			e = $('<span/>', { class:'disc-btn', html:'<span class="icon likebutton"></span>' }),
			f = $('<span/>', { class:'disc-btn', text:'share' })
		).appendTo( $(article) );
		//a.click( function(x){ openComments(d.id,x); } );
		b.click( function(x){ openReply(d.id,x); } );
		c.click( function(x){ openFlag(d.id,x); } );
		e.click( function(x){ openLike(d.id,x); } );
        f.click( function(x){ openShare(d.id, d.article_url, Encoder.htmlDecode(d.heading), x); } );
	};

	function insertAttachments(d) {
		var att = $('#attachments');
		var i = 0;
		var template = '<div id="article-{{i}}" class="article"><h2>{{heading}}</h2><p class="byline">by {{{author}}}<br />{{{format_created}}}</p><p><a href="{{{image.original}}}"><img src="{{{image.medium}}}" class="photo" /></a></p><p>{{{article}}}</p>';
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
                if (! a.image.medium) { 
                    a.image.medium = a.image.original;
                }
				var text = Mustache.render( template, a );

				comment = $.parseHTML( text );
				// create some buttons
				$('<div/>', { class:'disc' }).append(
					a = $('<span/>', { class:'disc-btn', text:'reply' }),
                    b = $('<span/>', { class:'disc-btn', html:'<span class="icon flagbutton"></span>' }),
                    c = $('<span/>', { class:'disc-btn', html:'<span class="icon likebutton"></span>' })
				).appendTo( $(comment) );
				a.click( function (x) { openReply(d.id,x); } );
				b.click( function (x) { openFlag(d.id,x); } );
				c.click( function (x) { openLike(d.id,x); } );

				att.append( comment );
			}
		);
	};
    function makeOpenReplyHandler(id) {
        return function (x) { openReply(id, x); };
    }
    function makeOpenFlagHandler(id) {
        return function (x) { openFlag(id, x); };
    }
    function makeOpenLikeHandler(id) {
        return function (x) { openLike(id, x); };
    }
    // fixme - comments don't have images. they can have images.
	function insertComments(d) {
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
                data.attachment = "<img src='"+data.image.medium+"' class='photo'>";
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
            a.click( makeOpenReplyHandler(d.id) );
            b.click( makeOpenFlagHandler(d.id) );
            c.click( makeOpenLikeHandler(d.id) );

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
	function setCSS() {
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
    };
	// recover stylesheet values from localStorage or a cookie
	// call this before using any styles
	function recoverCSS() {
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
				if ( cookies[i].indexOf("format") === 0 ) {
					var values = (cookies[i]).substr(7).split(',');
					color = values[0];
					font = values[1];
					fontsize = values[2];
				}
			}
		}
        // add a delay to give link tags to get inserted
        window.setTimeout(setCSS, 100);
    };

	//-----INITIALIZE----------------
	//
	// attach actions to buttons
    $('#thumbscreenbutton').on('click',function(){History.back();});
    $('#blocal'   ).on('click',function(){History.pushState(null,"local","?v=loca");});
    $('#bbreaking').on('click',function(){History.pushState(null,"breaking news","?v=brea");});
    $('#bcalendar').on('click',function(){History.pushState(null,"calendar","?v=cale");});
    $('#bfeatures').on('click',function(){History.pushState(null,"features","?v=feat");});
    $('#bpublish' ).on('click',function(){History.pushState(null,"publish","?v=publ");});
    $('#blatestcomments' ).on('click',function(){History.pushState(null,"latest comments","?v=comm");});
	// comment form
    $('#add-comment-button' ).on('click', function(evt){IMC.postComment(evt); return false;});
    $('#disclose').on('click',function(){IMC.toggleCommentForm();});
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

    $('#editor').hide(0);

    displayFromQuery();

	$('#publish').append('publish');

	// load up headlines from the server
	function headlineLoader(j) {
			console.log('loaded the headlines');
			local = j.local;
			feature = j.features;
			calendar = j.calendar;
			breakingnews = j.breakingnews;
			latestcomments = j.latestcomments;

			localCache = formatArticleList( 'local', local, 0 );
			$('#local').append( localCache );
			attachArticleListClickHandler( 'local', local, 0 );

			breakingnewsCache = formatArticleList( 'breaking', breakingnews, 0 );
			$('#breakingnews').append( breakingnewsCache );
			attachArticleListClickHandler( 'breaking', breakingnews, 0 );

			calendarCache = formatCalendarList( calendar );
			$('#calendar').append( calendarCache );
			attachCalendarListClickHandler( calendar );

			featureCache = formatArticleList( 'feature', feature, 0 );
			$('#feature').append( featureCache );
			attachArticleListClickHandler( 'feature', feature, 0 );
            insertFeaturePreview(0);
            insertFeaturePreview(1);
            insertFeaturePreview(2);

            // fixme - this stuff should be done on the server
            // insert the images if they exist
            function insertFeaturePreview(i) {
                var featElement = $('#id-' + feature[i].id);
                $.getJSON(getProxyUrl('http://la.indymedia.org'+feature[i].url), function(data) {
                    var image = $('<img>');
                    image.load(function(){
                        featElement.prepend($('<br>'));
                        featElement.prepend(image);
                    });
                    image.attr('src', data.article.linked_file);
                });
            }


            // fixme - we need to send a css-name prefix into formatArticleList so each of these
            // is correctly namespaced
			latestCommentsCache = formatArticleList( 'comment', latestcomments, 1 );
			$('#latestcomments').append( latestCommentsCache );
			attachArticleListClickHandler( 'comment', latestcomments, 1 );
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
		getProxyUrl("http://la.indymedia.org/js/ws/regen.php"),
		headlineLoader,
		function (j) {
			console.log("some kind of error happened");
		}
	);

	// reload saved settings for CSS
	recoverCSS();
}; // end of the layout module

function makeUrlClickHandler(url, scrollToBottom) {
    return function() { 
        History.pushState(null,"local","?v=cont&stb=" + scrollToBottom + "&url=http://la.indymedia.org" + url); 
    };
}
var attachArticleListClickHandler = function(prefix, articles, scrollToBottom) {
	for(var i=0; i < articles.length; i++) {
		var row = $('#'+prefix+'-id-'+articles[i].id);
		row.on('click', makeUrlClickHandler(articles[i].url, scrollToBottom));
        row.html(row.contents().text()); // replaces link with title text
	}
};
var attachCalendarListClickHandler = function(articles) {
	for(var i=0; i < articles.length; i++) {
		var row = $('#calendar-id-'+articles[i].id);
        row.on('click', makeUrlClickHandler(articles[i].url, 0));
		var link = $('#id-'+articles[i].id + " a");
		link.html(link.contents().text()); // replaces link with title text
	}
};
/**
 * json: an array of article link objects
 */
function formatArticleList(prefix, json, scrollToBottom) {
	if (json === null) {
		console.log("json is null");
		return;
	}
	  var html = '<ul class="articlelist">';
	  for(var i = 0; i < json.length ; i++) {
	  	j = json[i];
		html += '<li id="'+prefix+'-id-'+j.id+'" class="noselect"><a href="?v=cont&stb='+scrollToBottom+'&url=http://la.indymedia.org' +
		j.url + 
        '">' + 
        j.title + 
        '</a></li>';
	  }
	  html = html + '</ul>';	
	  return html;
};

function formatCalendarList(json) {
	if (json === null) {
		console.log("json is null");
		return;
	}
	  var html = '<ul class="articlelist">';
	  for(var i = 0; i < json.length ; i++) {
	  	j = json[i];
			html += '<li id="calendar-id-'+j.id+'" class="noselect"><a href="?v=cont&url=http://la.indymedia.org' +
			j.url + '">' + j.title + '</a>' + "<br />&nbsp;<span class='eventdate'>" + j.start + '</span></li>';
	  }
	  html = html + '</ul>';	
	  return html;
};

// useful modules
var EmbedVideo = function() {
	/* finds plain youtube urls and turns them into embeds */
	function embedYouTube(s) {
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
	function embedDailyMotion(s) {
	};
	return {
		embedYouTube: embedYouTube,
		embedDailyMotion: embedDailyMotion
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
function getProxyUrl(url) {
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
	var url = search.url; // means we want to view a specific url
	var v = search.v; // means view
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
	var cache = search.cache;
	if (cache=="1") {
		localStorage.rsstime = 0;
	}
	layoutModule($, EmbedVideo() );

}
jQuery(main);
