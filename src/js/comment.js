var upArrow = require('./up-arrow.js');
// var $ = require('jquery');

/**
 * Usage x = new Comment('#editor', '#disclose');
 */
function Comment(editorSel, discloseSel) {
    var editor;
    var disclose;
    var commentSubject;
    var commentText;
    var commentAuthor;
    var commentSubmit;
    var commentAppender = null;

    editor = $(editorSel);
    disclose = $(discloseSel);
    commentSubject = $('<input name="subject" type="text" size="40" placeholder="Subject" />');
    commentAuthor = $('<input name="author" type="text" size="20" placeholder="Your Name" />');
    commentText = $('<textarea placeholder="enter your comment here">');
    commentSubmit = $('<input type="button" value="post" />');
    editor.append('<label>Subject </label><br />');
    editor.append(commentSubject);
    editor.append('<br /><label>Author </label><br />');
    editor.append(commentAuthor).append('<br />');
    editor.append(commentText).append('<br />');
    editor.append(commentSubmit);
    commentSubmit.on('click', function(evt) {post(evt); return false;});
    disclose.on('click', toggle);

    function getIdFromQuery() {
        var state = History.getState();
        var uri = new URI(state.url);	
        var values = URI.parseQuery(uri.query());
        var url = values.url;
        var parts = /\/([0-9]+)\.json$/.exec(url);
        var id = parts[1];
        return parseInt(id);
    }

    function setCommentAppender(func) {
        commentAppender = func;
    }

    function post( evt ) {
        evt.preventDefault(); 
        evt.stopPropagation(); 

        var subject = commentSubject.val();
        var text = commentText.val();
        var author = commentAuthor.val();

        if (subject==='' || text==='' || author==='') {
            alert("No empty fields allowed");
            return false;
        }
        var csrf_token = editor.attr('data-csrf-token');

        url = '/js/ws/post.php';
        data = {
            "csrf_token": csrf_token,
            "author": author,
            "subject": subject,
            "text": text,
            "parent_id": getIdFromQuery()
        };
        console.log(data);
        $.post( url, data,
            function(result) {
                if (commentAppender) {
                    commentAppender(result);
                } else {
                    location.reload();
                    return false;
                }
            }, 'json')
            .fail( function() {
                alert("Post Failed!");
                return false;
            });
        window.localStorage.scrollToBottom = 1;
        return false;
    };

    function hide() {
        editor.hide(0);
        disclose.html('&#9654; Add Comment');
    };

    function toggle() {
        if (editor.css('display')=='none') {
            editor.slideDown({
                duration: 500, 
                progress: upArrow.scrollDown
            });
            disclose.html('&#9660; Add Comment');
            $.get('/js/ws/csrf.php', function(result) {
                editor.attr('data-csrf-token', result.csrf_token);
            }, 'json');
        } else {
            hide();
        }
    };

    function disableCommentDiscloser() {
        editor.hide();
        disclose.hide();
    };

    function enableCommentDiscloser() {
        disclose.show();
    };
    function clear() {
        commentAuthor.val(undefined);
        commentSubject.val(undefined);
        commentText.val(undefined);
    }
    return {
        disableCommentDiscloser: disableCommentDiscloser,
        enableCommentDiscloser: enableCommentDiscloser,
        setCommentAppender: setCommentAppender,
        hide: hide,
        toggle: toggle,
        clear: clear,
        post: post,
        setAuthor: function setAuthor(t) { commentAuthor.val(t); },
        setSubject: function setSubject(t) { commentSubject.val(t); },
        setText: function setText(t) { commentText.val(t); }
    };
}
module.exports = Comment;
