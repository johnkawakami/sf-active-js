
describe("comment", function() {
    var comment;
    beforeEach(function() {
        var elements = $('<div id="disclose"></div><div id="edit"></div>');
        $('body').append(elements);
        comment = Comment('#edit', '#disclose');
    });
    afterEach(function() {
        $('#disclose').remove();
        $('#edit').remove();
    });
    it("Comment should add three inputs and one textarea.", function() {
        expect($('input').length).toEqual(3);
        expect($('textarea').length).toEqual(1);
    });
    it("should hide the form", function() {
        comment.hide();
        expect($('input:visible').length).toEqual(0);
    });
    it("should fill and clear the form", function() {
        comment.setSubject('boo');
        expect($('input:eq(0)').val()).toEqual('boo');
        comment.setAuthor('foo');
        expect($('input:eq(1)').val()).toEqual('foo');
        comment.setText('bar');
        expect($('textarea:eq(0)').val()).toEqual('bar');
        comment.clear();
        expect($('input:eq(0)').val()).toEqual('');
        expect($('input:eq(1)').val()).toEqual('');
        expect($('textarea:eq(0)').val()).toEqual('');
    });
    it("should hide the disclosure", function() {
        comment.disableCommentDiscloser();
        expect($('#disclose:visible').length).toEqual(0);
    });
    it("should show the disclosure", function() {
        comment.enableCommentDiscloser();
        expect($('#disclose:visible').length).toEqual(1);
    });
});
