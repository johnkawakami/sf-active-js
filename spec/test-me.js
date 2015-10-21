

describe("test-me", function() {
    it("should add one to the value.", function() {
        var testMe = new TestMe(1);
        expect(testMe.add(1)).toEqual(2);
    });
});
