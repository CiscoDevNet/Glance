/**
 * Extend target with properties from sources.
 * @method extend
 * @param target {Object} The target object to be extended.
 * @param source* {Object} The source objects.
 * @return {Object}
 */
nx.extend = function (target) {
    for (var i = 1, length = arguments.length; i < length; i++) {
        var arg = arguments[i];
        for (var key in arg) {
            if (arg.hasOwnProperty(key)) {
                target[key] = arg[key];
            }
        }
    }
    return target;
};
