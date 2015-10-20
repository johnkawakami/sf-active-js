var arrowPoller;

function arrow() {
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
}
function activateArrow() {
    if (arrowPoller) {
        // do nothing
    } else {
        arrowPoller = window.setInterval( arrow, 500 );
    }
    $('#arrow').on( 'click', scrollUp );
}
function deactivateArrow() {
    $('#arrow').fadeOut();
    if (arrowPoller) {
        window.clearInterval( arrowPoller );
        delete(arrowPoller);
    }
}
function makeScrollUpFrame(pos) {
    return function() {
        $(document).scrollTop(pos);
    };
}
/**
 * Replace this with a shortr jquery call that does this.
 */
function scrollUp() {
    var d = $(document);
    var start = d.scrollTop();
    var end = 0;
    var divs = 20;
    var divsquared = divs * divs;
    var delta = ( start - end);
    var i;
    for( i = 0; i < divs; i++ ) {
        pos = i * i * delta / (divsquared) ;
        window.setTimeout(makeScrollUpFrame(pos), (divs-i)*20);
    }
}
function scrollDown() {
    var d = $(document);
    d.scrollTop(d.height());
}

module.exports = {
    activateArrow: activateArrow,
    deactivateArrow: deactivateArrow,
    scrollDown: scrollDown
};
