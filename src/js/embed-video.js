
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

module.exports = {
    embedYouTube: embedYouTube
};
