(function (nx) {
    var hasown = Object.prototype.hasOwnProperty;
    var tostr = Object.prototype.toString;
    /**
     * Check whether target is specified type.
     * @method is
     * @param target {Object} The target object to be checked.
     * @param type {String|Function} The type could either be a string or a class object.
     * @return {Boolean}
     */
    nx.is = function (target, type) {
        if (target && target.__is__) {
            return target.__is__(type);
        } else {
            switch (type) {
            case undefined:
            case "Undefined":
                return target === undefined;
            case null:
            case "Null":
                return target === null;
            case Object:
            case "Object":
                return target && (typeof target === "object");
            case String:
            case "String":
                return typeof target === "string";
            case Boolean:
            case "Boolean":
                return typeof target === "boolean";
            case "NaN":
                return isNaN(target);
            case Number:
            case "Number":
                return typeof target === "number";
            case "Function":
                return typeof target === type.toLowerCase();
            case Array:
            case "Array":
                return target && target.constructor === Array;
            case "Arguments":
                return tostr.call(target) === "[object Arguments]";
            case "PlainObject":
                var key;
                if (!target || tostr.call(target) !== "[object Object]" || target.nodeType || target === window) {
                    return false;
                }
                try {
                    // Not own constructor property must be Object
                    if (target.constructor && !hasown.call(target, "constructor") && !hasown.call(target.constructor.prototype, "isPrototypeOf")) {
                        return false;
                    }
                } catch (e) {
                    // IE8,9 Will throw exceptions on certain host objects #9897
                    return false;
                }
                for (key in target) {}
                return key === undefined || hasown.call(target, key);
            default:
                // make is(NaN, NaN)===true
                if (typeof type === "number" && typeof target === "number" && isNaN(type) && isNaN(target)) {
                    return true;
                }
                // understand path as class
                if (typeof type === "string") {
                    type = nx.path(type);
                }
                // check normal functions
                if (target && type) {
                    if (typeof type === "function") {
                        // quick check 
                        if (target instanceof type) {
                            return true;
                        }
                    } else if (type.prototype) {
                        // FIXME it's not function in PhantomJS browser, so...
                        return target instanceof type;
                    }
                }
            }
            return false;
        }
    };
})(nx);
