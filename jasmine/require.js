
// for commonjs-style modules with constructor functions
require = function(name) {
    console.log('fake require called with ' + name);
};
module = {
    exports: {}
};

// for d3-style objects in a global namespace
window.IMC = window.IMC || {};

