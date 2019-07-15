/**
 * @class string
 * @namespace nx
 */
(function(nx) {
    var REG_TRIM = /^\s+|\s+$/g;
    nx.string = {
        trim: function(str) {
            if (str.trim) {
                return str.trim();
            }
            return str.replace(REG_TRIM, "");
        },
        camelize: function(str) {
            return str.replace(/-\w/g, function(c) {
                return c.charAt(1).toUpperCase();
            });
        },
        uncamelize: function(str) {
            return str.replace(/[A-Z]/g, function(c) {
                return "-" + c.toLowerCase();
            });
        }
    };
})(nx);
