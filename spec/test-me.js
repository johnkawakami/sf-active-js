

describe("test-me", function() {
    it("should add one to the value.", function() {
        var testMe = new TestMe(1);
        expect(testMe.add(1)).toEqual(2);
    });

    it("should also add one to the value.", function() {
        expect(IMC.testMe.add(1)).toEqual(2);
    });
});
