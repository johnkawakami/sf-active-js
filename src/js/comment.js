var upArrow = require('./up-arrow.js');

function getIdFromQuery() {
    var state = History.getState();
    var uri = new URI(state.url);	
    var values = URI.parseQuery(uri.query());
    var url = values.url;
    var parts = /\/([0-9]+)\.json$/.exec(url);
    var id = parts[1];
    return parseInt(id);
};

function postComment( evt ) {
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
        "parent_id": getIdFromQuery()
	};
    console.log(data);
	$.post( url, data,
		function(result) {
            // try to force a refresh
            location.reload();
            // fixme - just get the new json file and insert the new comment.
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

function hideCommentForm() {
	var editor = $('#editor');
    editor.hide(0);
    $('#disclose').html('&#9654; Add Comment');
};

function toggleCommentForm() {
	var editor = $('#editor');
	if (editor.css('display')=='none') {
        editor.slideDown({
            duration: 500, 
            progress: upArrow.scrollDown
        });
		$('#disclose').html('&#9660; Add Comment');
        $.get('/js/ws/csrf.php', function(result) {
            $('#editor').attr('data-csrf-token', result.csrf_token);
        }, 'json');
	} else {
        hideCommentForm();
	}
};

function disableCommentDiscloser() {
    $('#editor').addClass('hidden');
    $('#disclose').addClass('hidden');
};

function enableCommentDiscloser() {
    $('#disclose').removeClass('hidden');
};

module.exports = {
    disableCommentDiscloser: disableCommentDiscloser,
    enableCommentDiscloser: enableCommentDiscloser,
    hideCommentForm: hideCommentForm,
    toggleCommentForm: toggleCommentForm,
    postComment: postComment
};
