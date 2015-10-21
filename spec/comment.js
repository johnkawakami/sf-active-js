
describe("comment", function() {
    it("should add one to the value.", function() {
        var comment = new Comment();
        expect(testMe.add(1)).toEqual(2);
    });

    it("should also add one to the value.", function() {
        expect(IMC.testMe.add(1)).toEqual(2);
    });
});
