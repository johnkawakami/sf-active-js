settings = require('./settings.js');
upArrow = require('./up-arrow.js');
comment = require('./comment.js');
flag = require('./flag.js');
embedAudio = require('./embed-audio.js');
embedVideo = require('./embed-video.js');
share = require('./share.js');
editor = require('./editor.js');
layout = require('./layout.js');

//start of application
/* execute the page after the entire DOM is loaded */
window.IMC = window.IMC || {};
window.IMC.main = function main() {
    console.log('in main');
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

    settings.recoverCSS();

    layout.init();
}
