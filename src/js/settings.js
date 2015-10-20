upArrow = require('./up-arrow.js');

function showSettings() {
  var sets = ['black','white','small','medium','large','sans','serif'];
    $.map( sets, function(a,b) { $('#settings-'+a).removeClass('lit'); } );

    var vals = recoverSettings();
    color = vals[0];
    font = vals[1];
    fontsize = vals[2];

    if (color==1) { $('#settings-white').addClass('lit'); }	
    if (color==2) { $('#settings-black').addClass('lit'); }	
    if (fontsize==1) { $('#settings-small').addClass('lit'); }	
    if (fontsize==2) { $('#settings-medium').addClass('lit'); }	
    if (fontsize==3) { $('#settings-large').addClass('lit'); }	
    if (font==1) { $('#settings-sans').addClass('lit'); }	
    if (font==2) { $('#settings-serif').addClass('lit'); }	
};


// -----------SETTINGS--------------------------
//
// Swaps in different css files.  
// For now, loads in the theme parts individually, but eventually, we will be constructing the
// url from the cookie values of these different settings.  So they'll have names like 
// theme-1-5-2.css.  There are potentialy dozens or hundreds of css files, each very short, like < 1k.
// I should be using an ID attribute on the link tags. -fixme
function setCSS(color, font, fontsize) {
    console.log('in setCSS');
    var links = document.getElementsByTagName('link');
    if (typeof links[3] === 'undefined') {
        // if the page isn't ready for CSS, try again in 1 second
        window.setTimeout(callSetCSSLater(color, font, fontsize), 1000);
    } else {
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
};
function callSetCSSLater(color, font, fontsize) {
    return function() { setCSS(color, font, fontsize); };
}
// recover stylesheet values from localStorage or a cookie
// call this before using any styles
function recoverSettings() {
    console.log('in recoverCSS');
    if (localStorage) {
        color = localStorage['imc-js.color'];
        font = localStorage['imc-js.font'];
        fontsize = localStorage['imc-js.fontsize'];
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
    if (!color || color==="undefined") color=2;
    if (!font || font==="undefined") font=1;
    if (!fontsize || fontsize==="undefined") fontsize=2;
    // add a delay to give link tags to get inserted
    return [ color, font, fontsize ];
};
function recoverCSS() {
    var vals = recoverSettings();
    color = vals[0];
    font = vals[1];
    fontsize = vals[2];
    window.setTimeout(callSetCSSLater(color, font, fontsize), 300);
}

module.exports = {
    setCSS: setCSS,
    recoverCSS: recoverCSS
};
