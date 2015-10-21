
var upArrow = require('./up-arrow.js');
var share = require('./share.js');
var Comment = require('./comment.js');

var spinnerCounter = 0;
var breakingnewsCache = null;
var featureCache = null;
var localCache = null;
var comment;

// display switcher
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

/** 
 * state change hander - routes all the URLs to the correct screen 
 * param 'v' picks a view
 * param 'url' sets a url if needed
 * fixme - doesn't work in mobile chrome.
 */
function displayFromQuery() {
    console.log('in displayFromQuery');
    var state = History.getState();
    var uri = new URI(state.url);	
    var values = URI.parseQuery(uri.query());
    var currentURL;
    console.log(values);

    switch(values.v) {
        case 'cont': 
            if (values.url) {
                clearContent();
                displaySwitcher(values.v);
                comment.clear();
                $.getJSON( getProxyUrl(values.url),
                function (d) {
                        d.article.numcomments = d.comments.length;
                        insertStory( d.article );
                        insertAttachments( d.attachments );
                        insertComments( d.comments );
                        if (window.localStorage.scrollToBottom==1) {
                            window.localStorage.scrollToBottom = 0;
                            upArrow.scrollDown();
                        }
                        if (values.stb=='1') {
                            upArrow.scrollDown();
                        }
                        currentURL = values.url;
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
}
function displaySwitcher(view) {
    if (view===null || view==="") view='thum';
    console.log(views);
    console.log("switching to " + view);
    console.log('comment is');
    console.log(comment);
    for (var v in views) {
        if (v == view) {
            $(views[v][0]).css('display', 'block');
            $(document).attr('title', views[v][1]);
            $('#header-title').html(views[v][1]);
            comment.hide();
            if (v=='cont' || v=='publ') {
                comment.enableCommentDiscloser();
            } else {
                comment.disableCommentDiscloser();
            }
        } else {
            $(views[v][0]).css('display', 'none');
        }
    }
}


//
//-----------------------------------------------------------list layouts
//
function makeUrlClickHandler(url, scrollToBottom) {
    return function() { 
        History.pushState(null,"local","?v=cont&stb=" + scrollToBottom + "&url=http://la.indymedia.org" + url); 
    };
}

//------------------------------------------------------------article list

function attachArticleListClickHandler(prefix, articles, scrollToBottom) {
	for(var i=0; i < articles.length; i++) {
		var row = $('#'+prefix+'-id-'+articles[i].id);
		row.on('click', makeUrlClickHandler(articles[i].url, scrollToBottom));
        row.html(row.contents().text()); // replaces link with title text
	}
}
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
}

//-------------------------------------------------------------calendar list

function attachCalendarListClickHandler(articles) {
	for(var i=0; i < articles.length; i++) {
		var row = $('#calendar-id-'+articles[i].id);
        row.on('click', makeUrlClickHandler(articles[i].url, 0));
		var link = $('#id-'+articles[i].id + " a");
		link.html(link.contents().text()); // replaces link with title text
	}
}
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
}

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

// -------------- HANDLERS ------------------------
function openReply(id, x) {
}
function makeOpenReplyHandler(id) {
    return function (x) { openReply(id, x); };
}

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
    upArrow.deactivateArrow();
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
function makeOpenFlagHandler(id) {
    return function (x) { openFlag(id, x); };
}
function closeFlag() {
    upArrow.activateArrow();
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
    $('#share-twitter').click(share.twitter(id, title));
    $('#share-facebook').click(share.facebook(url, title));
    $('#share-google').click(share.google(id));
    $('#share-email').click(share.email(url, title));
    closeSettings();
    closeFlag();
    upArrow.deactivateArrow();
    $('#settingswrapper').fadeIn().on('click',closeShare);
    s.css('position','fixed').css('bottom','0').css('left','0');
    s.slideDown();
    return false;
};
function makeOpenShareHandler(id) {
    return function (x) { openShare(id, x); };
}
function closeShare() {
    upArrow.activateArrow();
    $('#share').fadeOut();
    $('#settingswrapper').fadeOut();
    $('#share-twitter').off();
    $('#share-facebook').off();
    $('#share-google').off();
    $('#share-email').off();
    $('#share').slideUp();
    return false;
};

function openLike(id, x) {
}
function makeOpenLikeHandler(id) {
    return function (x) { openLike(id, x); };
}

function openSettings() {
    closeShare();
    closeFlag();
    upArrow.deactivateArrow();
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
//--------------------------------------------------------article layout functions
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
    b.click(makeOpenReplyHandler(d.id));
    c.click(makeOpenFlagHandler(d.id));
    e.click(makeOpenLikeHandler(d.id));
    f.click( function(x){ openShare(d.id, d.article_url, Encoder.htmlDecode(d.heading), x); } );
};

function insertAttachments(d) {
    var att = $('#attachments');
    var i = 0;
    var comment;
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
            a.click(makeOpenReplyHandler(d.id,x));
            b.click(makeOpenFlagHandler(d.id,x));
            c.click(makeOpenLikeHandler(d.id,x));

            att.append( comment );
        }
    );
};

// fixme - comments don't have images. they can have images.
function insertComments(d) {
    var comment;
    var commentTemplate = '<div id="article-{{i}}" class="comment"><h2>{{{heading}}}</h2><p>by {{{author}}}<br />{{{format_created}}}</p>{{{attachment}}}{{{article}}}<p><a href="{{{link}}}">{{{link}}}</a></p></div>';
    var comm = $('#comments');
    comm.html(''); // clear it out
    for(var i=0;i<d.length;i++) {
        var data = d[i];
        data.i = i;
        data.article = Encoder.htmlDecode(data.article);
        console.log(data.article);
        if (data.mime_type=='text/plain') {
          data.article = data.article.replace( /\n/mg, '<br />' );
        }
        if (/image/.test(data.mime_type)) {
          data.attachment = "<img src='"+data.image.medium+"' class='photo'>";
        }
        data.author = Encoder.htmlDecode(data.author);
        var text = Mustache.render(commentTemplate, data );

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
}



//--------------------------------------------------------- headline loader
function headlineLoader(j) {
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
}
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

function init() {
    console.log('in layout.init');
    // attach the comment form
    comment = Comment('#editor', '#disclose');
    console.log('just created comment');
    console.log(comment);

    $('#thumbscreenbutton').on('click',function(){History.back();});
    $('#blocal'   ).on('click',function(){History.pushState(null,"local","?v=loca");});
    $('#bbreaking').on('click',function(){History.pushState(null,"breaking news","?v=brea");});
    $('#bcalendar').on('click',function(){History.pushState(null,"calendar","?v=cale");});
    $('#bfeatures').on('click',function(){History.pushState(null,"features","?v=feat");});
    $('#bpublish' ).on('click',function(){History.pushState(null,"publish","?v=publ");});
    $('#blatestcomments' ).on('click',function(){History.pushState(null,"latest comments","?v=comm");});
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

    $.getJSON(
        getProxyUrl("http://la.indymedia.org/js/ws/regen.php"),
        headlineLoader,
        function (j) {
            console.log("some kind of error happened");
        }
    );
}

module.exports = {
    init: init
}
