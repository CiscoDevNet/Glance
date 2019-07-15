/**
 * Get value from target specified by a path and optionally set a value for it.
 * @method path
 * @param target {Object} The target object.
 * @param path {String} The path.
 * @param [value] {*} The value to be set.
 * @return {*}
 */
nx.path = function(target, path, value) {
    var notset = arguments.length < 3;
    var result = target;
    if (path) {
        var tokens, token, length, i = 0;
        if (typeof path === "string") {
            tokens = path.split(".");
        } else if (nx.is(path, "Array")) {
            tokens = path;
        } else {
            return target;
        }
        length = tokens.length;
        if (notset) {
            for (; result && i < length; i++) {
                token = tokens[i];
                if (result.__get__) {
                    result = result.__get__(token);
                } else {
                    result = result[token];
                }
            }
        } else {
            length -= 1;
            for (; result && i < length; i++) {
                token = tokens[i];
                if (result.__get__) {
                    result = result.__get__(token);
                } else {
                    result = result[token] = result[token] || {};
                }
            }
            token = tokens[i];
            if (result) {
                if (result.__set__) {
                    result.__set__(token, value);
                } else {
                    result[token] = value;
                }
                result = value;
            }
        }
    }
    return result;
};
