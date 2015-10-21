
/**
 * Model module file that can be tested with Jasmine.
 * The issue with testing or coding is that we don't
 * have a library that will load the commonjs format.
 * So we have a dummy library, jasmine/require.js that
 * does nothing except prevent the error messages.
 * We can make a testable library by conforming to some
 * basic standards.
 */

/* first, create a constructor function for the entire library */

function TestMe(x) {
    /* next, define properties */
    var y = x;

    /* define a method, which we'll make public */
    function add(z) {
        return y + z;
    }

    /* finally, return an object with the public methods and properties */
    /* this is the revealing module pattern */
    return {
        add: add
    };
}

/* last, this is for the commonjs standard */
module.exports = TestMe;

/**
 * To use this in the commonjs environment, you do this:
 * var TestMe = require('./test-me.js');
 * var testMe = new TestMe(1);
 *
 * To use this in the testing environment, you do this.
 * var testMe = new TestMe(1);
 */

/* This code below is attached to the global IMC namespace */

IMC.testMe = {
    add: function(z) {
        return z + 1;
    }
};
