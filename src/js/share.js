function facebook(url, title) {
    return function() {
        window.open('https://www.facebook.com/sharer.php?u='+url+'&t='+encodeURIComponent(title));
    };
}
function google(id) { 
    return function() {
        window.open('https://plus.google.com/share?url=httpn://la.indymedia.org/display.php?id='+id);
    };
}
function twitter(id, title) { 
    return function() {
        window.open('https://www.twitter.com/share?text='+encodeURIComponent(title)+'&url=https://la.indymedia.org/display.php?id='+id);
    };
}
function email(url, title) { 
    return function() {
        window.open('mailto:email@example.com?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(url));
    };
}

module.exports = {
    facebook: facebook,
    google: google,
    twitter: twitter,
    email: email
}
