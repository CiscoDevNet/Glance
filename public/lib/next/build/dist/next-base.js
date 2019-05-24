/**
 * @module next-base
 */
var nx = {
    /*
     * @property VERSION
     * @type String
     * @static
     * @final
     */
    VERSION: '2.0.0',
    /*
     * @property global
     * @type Object
     * @static
     * @final
     */
    global: (function() {
        return this;
    }).call(null),
    SILENT: false,
    OPTIMIZED: false,
    TEXTUAL: true && (function() {
        try {
            return eval("(function A(){})").toString() === "function A(){}";
        } catch (e) {
            return false;
        }
    })()
};

var global = nx.global;
/// require base
/**
 * Just an idle function.
 *
 * @method idle
 */
nx.idle = function () {};
/**
 * Just an identity function.
 *
 * @method identity
 */
nx.identity = function (arg) {
    return arg;
};
/**
 * A function makes every thing boolean.
 *
 * @method bool
 */
nx.bool = function (x) {
    return !!x;
};
/**
 * Create a random UUID.
 *
 * @method uuid
 * @return {String} A UUID.
 */
nx.uuid = (function () {
    var last;
    var uuid = function (serial) {
        var i = 12;
        // check if it's asked to serialize
        if (serial && last) {
            var i, p = last.length - 1;
            for (i = 0; i < 12; i++) {
                last[p - i]++;
                if (last[p - i] < 16) {
                    break;
                }
                last[p - i] = 0;
            }
        }
        // check if not asked to serial or serial fail
        if (i < 12) {
            i = 0;
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                return last[i++].toString(16);
            }).toUpperCase();
        } else {
            last = [];
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                last.push(v);
                return v.toString(16);
            }).toUpperCase();
        }
    };
    uuid.serial = function () {
        return uuid(true);
    };
    return uuid;
})();
/**
 * Shallow clone target object.
 * @method clone
 * @param target {Object|Array} The target object to be cloned.
 * @return {Object} The cloned object.
 */

nx.clone = (function () {
    var deepclone = (function () {
        var get, put, top, keys, clone;
        get = function (map, key) {
            for (var i = 0; i < map.length; i++) {
                if (map[i].key === key) {
                    return map[i].value;
                }
            }
            return null;
        };
        put = function (map, key, value) {
            var i;
            for (i = 0; i < map.length; i++) {
                if (map[i].key === key) {
                    map[i].value = value;
                    return;
                }
            }
            map[i] = {
                key: key,
                value: value
            };
        };
        top = function (stack) {
            if (stack.length === 0) {
                return null;
            }
            return stack[stack.length - 1];
        };
        keys = function (obj) {
            var keys = [];
            if (Object.prototype.toString.call(obj) == '[object Array]') {
                for (var i = 0; i < obj.length; i++) {
                    keys.push(i);
                }
            } else {
                for (var key in obj) {
                    keys.push(key);
                }
            }
            return keys;
        };
        clone = function (self) {
            // TODO clone DOM object
            if (window === self || document === self) {
                // window and document cannot be clone
                return null;
            }
            if (["null", "undefined", "number", "string", "boolean", "function"].indexOf(typeof self) >= 0) {
                return self;
            }
            if (!nx.is(self, "Array") && !nx.is(self, "PlainObject")) {
                return self;
            }
            var map = [],
                stack = [],
                origin = self,
                dest = (nx.is(self, "Array") ? [] : {});
            var stacktop, key, cached;
            // initialize the map and stack
            put(map, origin, dest);
            stack.push({
                origin: origin,
                dest: dest,
                keys: keys(origin),
                idx: 0
            });
            while (true) {
                stacktop = top(stack);
                if (!stacktop) {
                    // the whole object is cloned
                    break;
                }
                origin = stacktop.origin;
                dest = stacktop.dest;
                if (stacktop.keys.length <= stacktop.idx) {
                    // object on the stack top is cloned
                    stack.pop();
                    continue;
                }
                key = stacktop.keys[stacktop.idx++];
                // clone an object
                if (nx.is(origin[key], "Array")) {
                    dest[key] = [];
                } else if (nx.is(origin[key], "PlainObject")) {
                    dest[key] = {};
                } else {
                    dest[key] = origin[key];
                    continue;
                }
                // check if needn't deep into or cloned already
                cached = get(map, origin[key]);
                if (cached) {
                    dest[key] = cached;
                    continue;
                }
                // deep into the object
                put(map, origin[key], dest[key]);
                stack.push({
                    origin: origin[key],
                    dest: dest[key],
                    keys: keys(origin[key]),
                    idx: 0
                });
            }
            return dest;
        };
        return clone;
    })();
    return function (target, cfg) {
        if (target) {
            if (target.__clone__) {
                return target.__clone__(cfg);
            } else if (!cfg) {
                if (nx.is(target, 'Array')) {
                    return target.slice(0);
                } else {
                    var result = {};
                    for (var key in target) {
                        if (target.hasOwnProperty(key)) {
                            result[key] = target[key];
                        }
                    }

                    return result;
                }
            } else {
                // TODO more config options
                return deepclone(target);
            }
        } else {
            return target;
        }
    };
})();
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
/**
 * Iterate over target and execute the callback with context.
 * @method each
 * @param target {Object|Array|Iterable} The target object to be iterate over.
 * @param callback {Function} The callback function to execute.
 * @param context {Object} The context object which act as 'this'.
 */
nx.each = function (target, callback, context) {
    /* jshint -W014 */
    var broken = false;
    if (target && callback) {
        if (target.__class__ && target.__each__) {
            broken = (false === target.__each__(callback, context));
        } else {
            // FIXME maybe some other array-like things missed here
            if (nx.is(target, "Array") // normal Array
                || Object.prototype.toString.call(target) === "[object Arguments]" // array-like: arguments
                || nx.global.NodeList && target instanceof NodeList // array-like: NodeList
                || nx.global.HTMLCollection && target instanceof HTMLCollection // array-like: HTMLCollection
            ) {
                for (var i = 0, length = target.length; i < length; i++) {
                    if (callback.call(context, target[i], i) === false) {
                        broken = true;
                        break;
                    }
                }
            } else {
                for (var key in target) {
                    if (target.hasOwnProperty(key)) {
                        if (callback.call(context, target[key], key) === false) {
                            broken = true;
                            break;
                        }
                    }
                }
            }
        }
    }
    return !broken;
};
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
if (!Function.prototype.bind) {
    Function.prototype.bind = function (context) {
        var f = this;
        return function () {
            return f.apply(context, arguments);
        };
    };
}

(function () {
    return;
    // FIXME socket.io cannot work with it
    Function.prototype.apply = (function () {
        var apply = Function.prototype.apply; // the native one
        return function apply(context, args) {
            if (!args) {
                return this.call(context);
            }
            switch (args.length) {
            case 0:
                return this.call(context);
            case 1:
                return this.call(context, args[0]);
            case 2:
                return this.call(context, args[0], args[1]);
            case 3:
                return this.call(context, args[0], args[1], args[2]);
            case 4:
                return this.call(context, args[0], args[1], args[2], args[3]);
            case 5:
                return this.call(context, args[0], args[1], args[2], args[3], args[4]);
            case 6:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5]);
            case 7:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            case 8:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
            case 9:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
            case 10:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
            default:
                return apply.call(this, args);
            }
        };
    })();
})();

(function (nx) {
    var global = nx.global;
    var slice = Array.prototype.slice;
    nx.func = {
        apply: function (fn, ctx) {
            var len = arguments.length;
            var args = arguments[len - 1];
            if (!nx.is(args, "Array")) {
                if (args && args.length >= 0) {
                    args = slice.call(args);
                } else {
                    args = [];
                }
            }
            if (len > 3) {
                args = slice.call(arguments, 2, len - 1).concat(args);
            }
            return fn.apply(ctx, args);
        }
    };
})(nx);
nx.array = {
    times: function(times, value) {
        var result = [];
        while (times--) {
            result.push(value);
        }
        return result;
    },
    find: function(array, matcher, context) {
        if (array.find) {
            return array.find(matcher, context);
        }
        var i, item;
        for (i = 0; i < array.length; i++) {
            item = array[i];
            if (matcher.call(context, item, i, array)) {
                return item;
            }
        }
    },
    findLast: function(array) {
        var i, item;
        for (i = array.length - 1; i >= 0; i--) {
            item = array[i];
            if (matcher.call(context, item, i, array)) {
                return item;
            }
        }
    },
    findIndex: function(array, matcher, context) {
        if (array.findIndex) {
            return array.findIndex(matcher, context);
        }
        var i, item;
        for (i = 0; i < array.length; i++) {
            item = array[i];
            if (matcher.call(context, item, i, array)) {
                return i;
            }
        }
        return -1;
    },
    findLastIndex: function(array, matcher, context) {
        var i, item;
        for (i = array.length - 1; i >= 0; i--) {
            item = array[i];
            if (matcher.call(context, item, i, array)) {
                return i;
            }
        }
        return -1;
    },
    query: (function() {
        var i, internal = {
            publics: {
                select: function(array, selector) {
                    var rslt = [];
                    if ($.isArray(array) && $.isFunction(selector)) {
                        var i, item;
                        for (i = 0; i < array.length; i++) {
                            item = array[i];
                            if (selector(item)) {
                                rslt.push(item);
                            }
                        }
                    }
                    return rslt;
                },
                group: function(array, grouper) {
                    var map;
                    if ($.isFunction(grouper)) {
                        map = {};
                        var i, id, group;
                        for (i = 0; i < array.length; i++) {
                            id = grouper(array[i]);
                            if (!id || typeof id !== "string") {
                                continue;
                            }
                            group = map[id] = map[id] || [];
                            group.push(array[i]);
                        }
                    } else {
                        map = array;
                    }
                    return map;
                },
                aggregate: function(array, aggregater) {
                    var rslt = null,
                        key;
                    if ($.isFunction(aggregater)) {
                        if ($.isArray(array)) {
                            rslt = aggregater(array);
                        } else {
                            rslt = [];
                            for (key in array) {
                                rslt.push(aggregater(array[key], key));
                            }
                        }
                    }
                    return rslt;
                }
            },
            privates: {
                aggregate: function(array, args) {
                    var rslt, grouper = null,
                        aggregater = null;
                    // get original identfier and aggregater
                    if ($.isArray(args)) {
                        if (typeof args[args.length - 1] === "function") {
                            aggregater = args.pop();
                        }
                        grouper = (args.length > 1 ? args : args[0]);
                    } else {
                        grouper = args.map;
                        aggregater = args.aggregate;
                    }
                    // translate grouper into function if possible
                    if (typeof grouper === "string") {
                        grouper = grouper.replace(/\s/g, "").split(",");
                    }
                    if ($.isArray(grouper) && grouper[0] && typeof grouper[0] === "string") {
                        grouper = (function(keys) {
                            return function(obj) {
                                var i, o = {};
                                for (i = 0; i < keys.length; i++) {
                                    o[keys[i]] = obj[keys[i]];
                                }
                                return JSON.stringify(o);
                            };
                        })(grouper);
                    }
                    // do map aggregate
                    rslt = internal.publics.aggregate(internal.publics.group(array, grouper), aggregater);
                    return rslt;
                },
                mapping: function(array, mapper) {
                    var i, rslt;
                    // get item with path
                    if (typeof mapper === "string") {
                        mapper = (function(key) {
                            return function(item) {
                                return nx.path(item, key);
                            };
                        })(mapper);
                    }
                    if (mapper === true) {
                        rslt = EXPORT.clone(array);
                    } else if ($.isFunction(mapper)) {
                        if ($.isArray(array)) {
                            rslt = [];
                            for (i = 0; i < array.length; i++) {
                                rslt.push(mapper(array[i], i));
                            }
                        } else {
                            rslt = mapper(array, 0);
                        }
                    } else {
                        if ($.isArray(array)) {
                            rslt = array.slice();
                        } else {
                            rslt = array;
                        }
                    }
                    return rslt;
                },
                orderby: function(array, comparer) {
                    if (typeof comparer === "string") {
                        comparer = comparer.replace(/^\s*(.*)$/, "$1").replace(/\s*$/, "").replace(/\s*,\s*/g, ",").split(",");
                    }
                    if ($.isArray(comparer) && comparer[0] && typeof comparer[0] === "string") {
                        comparer = (function(keys) {
                            return function(o1, o2) {
                                var i, key, desc;
                                if (!o1 && !o2) {
                                    return 0;
                                }
                                for (i = 0; i < keys.length; i++) {
                                    key = keys[i];
                                    desc = /\sdesc$/.test(key);
                                    key = key.replace(/(\s+desc|\s+asc)$/, "");
                                    if (o1[key] > o2[key]) {
                                        return desc ? -1 : 1;
                                    } else if (o2[key] > o1[key]) {
                                        return desc ? 1 : -1;
                                    }
                                }
                                return 0;
                            };
                        })(comparer);
                    }
                    if (comparer && typeof comparer === "function") {
                        array.sort(comparer);
                    }
                    return array;
                }
            },
            query: function(array, options) {
                /**
                 * @doctype MarkDown
                 * options:
                 * - options.array [any*]
                 *   - the target array
                 * - options.select: function(any){return boolean;}
                 *   - *optional*
                 *   - pre-filter of the array
                 * - options.aggregate: {grouper:grouper,aggregater:aggregater} or [proplist, aggregater] or [prop, prop, ..., aggregater]
                 *   - *optional*
                 *   - proplist: "prop,prop,..."
                 *   - prop: property name on array items
                 *   - grouper: map an array item into a string key
                 *   - aggregater: function(mapped){return aggregated}
                 * - options.mapping: function(item){return newitem}
                 *   - *optional*
                 * - options.orderby: proplist or [prop, prop, ...]
                 *   - *optional*
                 */
                if (arguments.length == 1) {
                    options = array;
                    array = options.array;
                }
                if (!array) {
                    return array;
                }
                if (options.select) {
                    array = internal.publics.select(array, options.select);
                }
                if (options.aggregate) {
                    array = internal.privates.aggregate(array, options.aggregate);
                }
                if (options.mapping) {
                    array = internal.privates.mapping(array, options.mapping);
                }
                if (options.orderby) {
                    array = internal.privates.orderby(array, options.orderby);
                }
                return array;
            }
        };
        for (i in internal.publics) {
            internal.query[i] = internal.publics[i];
        }
        return internal.query;
    })(),
    count: function(arr, item) {
        var i, n = arr.length;
        var count = 0;
        for (i = 0; i < n; i++) {
            if (arr[i] === item) {
                count++;
            }
        }
        return count;
    },
    mapping: function(arr, fn, context) {
        var i, result = [];
        for (i = 0; i < arr.length; i++) {
            result[i] = fn.call(context, arr[i]);
        }
        return result;
    },
    cross: function cross(arr0, arr1, optimize) {
        var eqi, recurse;
        eqi = function(a0, a1) {
            var i0, i1, l0 = a0.length,
                l1 = a1.length;
            // find the cross
            for (i0 = 0, i1 = 0; i0 < l0; i0++) {
                for (i1 = 0; i1 < l1; i1++) {
                    if (a0[i0] === a1[i1]) {
                        return {
                            i0: i0,
                            i1: i1,
                            value: a0[i0]
                        };
                    }
                }
            }
            return null;
        };
        recurse = function(source, target) {
            var eqi0 = eqi(source, target),
                eqi1 = eqi(target, source),
                cross = [
                    []
                ];
            if (eqi0) {
                cross = EXPORT.mapcar(function(arr) {
                    arr.unshift(eqi0.value);
                }, recurse(source.slice(eqi0.i0 + 1), target.slice(eqi0.i1 + 1)));
                if (eqi0.i0 !== eqi1.i1) {
                    cross = cross.concat(EXPORT.mapcar(function(arr) {
                        arr.unshift(eqi1.value);
                    }, recurse(target.slice(eqi1.i0 + 1), source.slice(eqi1.i1 + 1))));
                }
            }
            switch (optimize) {
                case "max":
                    cross = [nx.array.query({
                        array: cross,
                        orderby: "length desc"
                    })[0]];
                    break;
                case "min":
                    cross = [nx.array.query({
                        array: cross,
                        orderby: "length"
                    })[0]];
                    break;
                default:
                    break;
            }
            return cross;
        };
        var crosses = recurse(arr0, arr1);
        if (optimize == "max" || optimize == "min") {
            return crosses[0];
        }
        return crosses;
    },
    diff: function(arr1, arr2) {
        // TODO better result with "move"
        var diff = [];
        var ac, il, ic, ir, ll, lc, lr, removal, addition;
        ac = nx.array.cross(al, ar, "max");
        il = ic = 0;
        ll = lc = lr = ar.length;
        for (il = 0, ic = 0, ir = 0, ll = al.length, lc = ac.length, lr = ar.length; il < ll || ic < lc || ir < lr; il++, ic++, ir++) {
            // get removals
            while (il < ll && al[il] !== ac[ic]) {
                diff.push({
                    action: "remove",
                    position: ir
                });
                il++;
            }
            // get additions
            while (ir < lr && ac[ic] !== ar[ir]) {
                diff.push({
                    action: "add",
                    position: ir,
                    object: ar[ir]
                });
                ir++;
            }
        }
        return diff;
    }
};
/**
 * @class date
 * @namespace nx
 */
nx.date = (function () {
    var weeks = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    var padZero = function (inString) {
        return ("00" + inString).slice(-2);
    };
    var selector = {
        "yyyy": function (date) {
            return date.getFullYear();
        },
        "yy": function (date) {
            return date.getFullYear().toString().slice(-2);
        },
        "MMMM": function (date) {
            return months[date.getMonth()];
        },
        "MMM": function (date) {
            return monthsShort[date.getMonth()];
        },
        "MM": function (date) {
            return padZero(date.getMonth() + 1);
        },
        "M": function (date) {
            return date.getMonth() + 1;
        },
        "dd": function (date) {
            return padZero(date.getDate());
        },
        "d": function (date) {
            return date.getDate();
        },
        "hh": function (date) {
            var h = date.getHours();
            return h === 12 ? "12" : padZero(h % 12);
        },
        "h": function (date) {
            var h = date.getHours();
            return h === 12 ? "12" : (h % 12);
        },
        "P": function (date) {
            return date.getHours() < 12 ? "AM" : "PM";
        },
        "HH": function (date) {
            return padZero(date.getHours());
        },
        "H": function (date) {
            return date.getHours();
        },
        "mm": function (date) {
            return padZero(date.getMinutes());
        },
        "m": function (date) {
            return date.getMinutes();
        },
        "ss": function (date) {
            return padZero(date.getSeconds());
        },
        "s": function (date) {
            return date.getSeconds();
        },
        "DDDD": function (date) {
            return weeks[date.getDay()];
        },
        "DDD": function (date) {
            return weeks[date.getDay()].substring(0, 3);
        },
        "D": function (date) {
            return date.getDay();
        }
    };
    return {
        now: Date.now,
        /**
         * A Date format function.
         * <table>
         * <tr><th>place holder</th><th>explain</th><th>example</th></tr>
         * <tr><td>yyyy</td><td>Full year</td><td>1970</td></tr>
         * <tr><td>yy</td><td>Short year</td><td>70</td></tr>
         * <tr><td>MMMM</td><td>Full month</td><td>January</td></tr>
         * <tr><td>MMM</td><td>Short month</td><td>Jan</td></tr>
         * <tr><td>MM</td><td>Month with pad 0</td><td>01</td></tr>
         * <tr><td>M</td><td>Month</td><td>1</td></tr>
         * <tr><td>dd</td><td>Day of month with pad 0</td><td>01</td></tr>
         * <tr><td>d</td><td>Day of month</td><td>1</td></tr>
         * <tr><td>hh</td><td>Hour in 12 with pad 0</td><td>00 or 12</td></tr>
         * <tr><td>h</td><td>Hour in 12</td><td>0 or 12</td></tr>
         * <tr><td>P</td><td>Period(AM/PM)</td><td>AM</td></tr>
         * <tr><td>HH</td>Hour in 24 with pad 0<td></td><td>00</td></tr>
         * <tr><td>H</td><td>Hour in 24</td><td>0</td></tr>
         * <tr><td>mm</td><td>Minute with pad 0</td><td>00</td></tr>
         * <tr><td>m</td><td>Minute</td><td>0</td></tr>
         * <tr><td>ss</td><td>Second with pad 0</td><td>00</td></tr>
         * <tr><td>s</td><td>Second</td><td>0</td></tr>
         * <tr><td>DDDD</td><td>Day name of week</td><td>Monday</td></tr>
         * <tr><td>DDD</td><td>Short day name of week</td><td>Mon</td></tr>
         * <tr><td>D</td><td>Day of week</td><td>0(Sunday)</td></tr>
         * </table>
         *
         * @method format
         * @param {String} format
         * @param {Date} date
         * @namespace nx.date
         */
        format: function (inFormat, inDate) {
            var format = inFormat || "yyyy-MM-dd hh:mm:ss DD";
            var date = inDate || new Date();
            return format.replace(/yyyy|yy|MMMM|MMM|MM|dd|d|hh|h|P|HH|H|mm|m|ss|s|DDDD|DDD|D/g, function (key) {
                return selector[key](date);
            });
        }
    };
})();
(function(nx) {
    function precised(f) {
        return function(param) {
            var v = f(param);
            return EXPORT.approximate(v, 0) ? 0 : v;
        }
    }

    nx.math = {
        approximate: function(a, b, precision) {
            precision = precision || 1e-10;
            var v = a - b;
            return v < precision && v > -precision;
        },
        square: function(v) {
            return v * v;
        },
        sin: precised(Math.sin),
        cos: precised(Math.cos),
        tan: precised(Math.tan),
        cot: function(a) {
            var tan = Math.tan(a);
            if (tan > 1e10 || tan < -1e10) {
                return 0;
            }
            return 1 / tan;
        },
        zero: function() {
            return 0
        },
        one: function() {
            return 1;
        },
        negative: function(v) {
            return -(v || 0);
        },
        and: function() {
            var i, result = !!arguments[0];
            for (i = 1; i < arguments.length; i++) {
                result = result && arguments[i];
            }
            return result;
        },
        or: function() {
            var i, result = !!arguments[0];
            for (i = 1; i < arguments.length; i++) {
                result = result || arguments[i];
            }
            return result;
        },
        not: function(x) {
            return !x;
        },
        square: function(x) {
            if (arguments.length > 1) {
                var i, result = 0;
                for (i = 0; i < arguments.length; i++) {
                    result += arguments[i] * arguments[i];
                }
            }
            return x * x || 0;
        },
        plus: function() {
            var x = arguments[0] || 0;
            for (i = 1; i < arguments.length; i++) {
                x += arguments[i];
            }
            return x;
        },
        plusone: function(x) {
            return x + 1;
        },
        multiply: function() {
            var x = arguments[0] || 1;
            for (i = 1; i < arguments.length; i++) {
                x *= arguments[i];
            }
            return x;
        },
        divide: function(a, b) {
            return a / b;
        },
        minus: function(a, b) {
            return a - b;
        },
        sign: Math.sign || function(v) {
            return v < 0 ? -1 : (v > 0 ? 1 : 0);
        }
    };
})(nx);
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
(function (nx) {
    // TODO
    nx.sets = function (target, values) {
        for (var key in values) {
            nx.path(target, key, values[key]);
        }
    };
})(nx);
(function(nx) {
    nx.timer = function(delay, callback) {
        var internal = {
            timeout: null,
            resources: [],
            again: function(delay2) {
                internal.timeout = setTimeout(function() {
                    clearTimeout(internal.timeout);
                    internal.timeout = null;
                    var resource = callback(internal.again);
                    resource && internal.resources.push(resource);
                }, delay2 >= 0 ? delay2 : delay);
            }
        };
        internal.again(delay);
        return {
            release: function() {
                internal.timeout && clearTimeout(internal.timeout);
                var resource;
                while (internal.resources.length) {
                    resource = internal.resources.pop();
                    if (resource && typeof resource.release === "function") {
                        resource.release();
                    }
                }
            }
        };
    };
})(nx);
/// require base, lang
nx.serial = (function () {
    var id = 1;
    return function () {
        return id++;
    };
})();
(function (nx) {
    nx.binding = function (paths, async, handler) {
        if (!(this instanceof nx.binding)) {
            // call as factory
            return new nx.binding(paths, async, handler);
        }
        // call as constructor
        if (arguments.length) {
            // optionalize arguments
            if (typeof paths === "function") {
		// (handler Function)
                handler = paths;
                async = false;
                paths = [];
            } else if (typeof paths === "boolean") {
		// (async Boolean, handler Function)
                handler = async;
                async = paths;
                paths = [];
            } else if (typeof async === "function") {
		// (paths String|Array, handler Function)
                handler = async;
                async = false;
            } else if (typeof paths !== "string" && !nx.is(paths, "Array")) {
		// (config Object)
                // paths is a config object
                handler = paths.handler;
                async = paths.async;
                paths = paths.paths || [];
            }
            // check for "," separated string paths
            if (typeof paths === "string") {
                paths = paths.replace(/\s/g, "").split(",");
            }
            // create options
            this.paths = paths;
            this.async = async;
            this.handler = handler;
        }
    };
})(nx);
(function(nx) {

    var global = nx.global;
    var hasown = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;
    var inMixin = function(clazz, type, marks) {
        marks = marks || {};
        var i, mixin, mixins = clazz.__mixins__ || [];
        for (i = 0; i < mixins.length; i++) {
            mixin = mixins[i];
            // mark as checked
            if (!marks[mixin.__id__]) {
                marks[mixin.__id__] = true;
            }
            if (mixin === type || mixin.prototype instanceof type) {
                return true;
            }
            if (isMixin(mixin, type, marks)) {
                return true;
            }
        }
    };

    /**
     * The base of any Classes defined in nx framework.
     * @class nx.Object
     * @constructor
     */
    function NXObject() {
        this.__id__ = nx.serial();
        this.__listeners__ = {};
        this.__watchers__ = {};
        this.__resources__ = {};
        this.__properties__ = nx.extend({}, this.__properties__);
        this.__methods__ = nx.extend({}, this.__methods__);
        this.self = this;
    }

    var NXPrototype = {
        constructor: NXObject,
        __nx__: true,
        __class__: NXObject,
        __namespace__: "nx.Object",
        __properties__: {},
        __methods__: {},
        __mixins__: [],
        __initializers__: [],
        global: global,
        /**
         * Call overridden method from super class
         * @method inherited
         */
        inherited: function(arg0) {
            var args = nx.is(arg0, "Arguments") ? arg0 : arguments;
            var caller = this.inherited.caller;
            var Super, Class, base = caller.__super__;
            if (caller.__name__ !== "init") {
                return base && base.apply(this, args);
            } else {
                // initialize super class if need
                if (base) {
                    Super = base.__class__;
                } else {
                    Super = base = NXObject;
                }
                if (!this.__type_initialized__[Super.__id__]) {
                    this.__type_initialized__[Super.__id__] = true;
                    base.apply(this, args);
                }
                // initialize my mixins
                Class = caller.__class__;
                nx.each(Class.__mixins__, function(mixin) {
                    if (!this.__type_initialized__[mixin.__id__]) {
                        this.__type_initialized__[mixin.__id__] = true;
                        mixin.__ctor__.call(this);
                    }
                }, this);
                // initialize my initializers
                nx.each(Class.__initializers__, function(initializer) {
                    initializer.initialize.call(this);
                }, this);
            }
        },
        /**
         * Retain or replace a resource.
         * If it's a replacing, the previous resource will be released.
         * 
         * @method retain
         * @param key Optional. If key specified, the previous resource will be released before the new resource added.
         * @param resource Optional. The resource to be retained. Could be a method which generates the resource.
         * @return The retained resource
         */
        retain: function(key, resource) {
            var argc = arguments.length;
            if (argc === 0) {
                return !this.__released__;
            }
            if (argc < 2) {
                if (typeof key === "string") {
                    return this.__resources__[key];
                }
                // TODO what if already retained
                return this.retain(nx.serial(), key);
            }
            // release the previous resource
            if (this.__resources__[key]) {
                if (this.__resources__[key] === resource) {
                    return resource;
                }
                this.__resources__[key].release();
            }
            // resource could be supplied as a factory function
            while (typeof resource === "function") {
                resource = resource.call(this);
            }
            // retain the resource
            if (resource && typeof resource.release === "function") {
                this.__resources__[key] = resource;
                return resource;
            } else {
                delete this.__resources__[key];
            }
        },
        /**
         * release all currently occurring resources.
         * @method release
         */
        release: function(key) {
            if (key === undefined) {
                this.__released__ = true;
                nx.each(this.__resources__, function(resource) {
                    resource && resource.release();
                });
                this.__resources__ = {};
            } else {
                if (this.__resources__[key]) {
                    this.__resources__[key].release();
                    delete this.__resources__[key];
                }
            }
        },
        /**
         * Add an event handler.
         * @method on
         * @param name {String}
         * @param handler {Function}
         * @param [context] {Object}
         */
        on: function(name, handler, context) {
            var map = this.__listeners__;
            var listeners = map[name] = map[name] || {
                size: 0
            };
            var id = nx.serial();
            var listener = {
                owner: this,
                handler: handler,
                context: context || this
            };
            listeners[id] = listener;
            listeners.size++;
            if (listeners.size === 1) {
                // first bind on the the event
                listener.owner.fire("+" + name);
            }
            return {
                id: id,
                release: function() {
                    if (hasown.call(listeners, id)) {
                        delete listeners[id];
                        listeners.size--;
                        if (!listeners.size) {
                            // last release on the event
                            listener.owner.fire("-" + name);
                        }
                    }
                }
            };
        },
        /**
         * Trigger an event.
         * @method fire
         * @param name {String}
         * @param [data] {*}
         */
        fire: function(name) {
            var args = slice.call(arguments, 1);
            var id, listener, existing = this.__listeners__[name];
            for (id in existing) {
                listener = existing[id];
                if (listener && listener.handler) {
                    result = listener.handler.apply(listener.context, [listener.owner].concat(args));
                    if (result === false) {
                        return false;
                    }
                }
            }
        },
        /**
         * @method
         * @param names
         * @param handler
         * @param context
         */
        watch: function(name, handler, context) {
            if (typeof handler !== "function") {
                return;
            }
            var map = this.__watchers__;
            var watchers = map[name] = map[name] || {
                size: 0
            };
            var owner = this;
            var id = nx.serial();
            var property = this[name];
            // add registry item on watchers
            var watcher = watchers[id] = {
                id: id,
                owner: this,
                name: name,
                handler: handler,
                affect: function(oldValue) {
                    // release previous resource
                    watcher.resource && watcher.resource.release();
                    // call the handler with new value
                    var resource;
                    var value = owner.__get__(name);
                    // use value itself as old value because the real old value is missing
                    resource = handler.call(context || owner, name, value, oldValue, owner);
                    if (resource && typeof resource.release === "function") {
                        watcher.resource = resource;
                    }
                }
            };
            // update watcher count and mark the property watched
            watchers.size++;
            // affect immediately
            // TODO use undefined or current value as old vlaue?
            watcher.affect();
            return {
                release: function() {
                    // release resource of watcher
                    watcher.resource && watcher.resource.release();
                    // clear the registry item on watchers
                    delete watchers[id];
                    // check the watcher count to update "watched" mark
                    if (!--watchers.size) {
                        delete map[name];
                    }
                }
            };
        },
        /**
         * @method notify
         * @param names
         * @param oldValue
         */
        notify: function(name, oldValue) {
            var id, watchers = this.__watchers__[name];
            for (id in watchers) {
                if (id !== "size") {
                    watchers[id].affect(oldValue);
                }
            }
        },
        __is__: function(type) {
            // understand type as path if string given
            if (typeof type === "string") {
                type = nx.path(global, type);
            }
            // make sure it's a class
            if (typeof type !== "function" || !type.__nx__) {
                return false;
            }
            // check the type
            if (this instanceof type) {
                return true;
            } else if (inMixin(this.__class__, type)) {
                return true;
            }
            return false;
        },
        __has__: function(name) {
            var member = this[name];
            return member && member.__type__ == 'property';
        },
        __get__: function(name) {
            var member = this[name];
            if (member && member.__type__ == 'property') {
                return member.call(this);
            } else {
                return member;
            }
        },
        __set__: function(name, value) {
            var member = this[name];
            if (!member && !hasown.call(this, name)) {
                NXObject.extendProperty(this, name, {});
                member = this[name];
            }
            if (typeof member === "function" && member.__type__ == 'property') {
                return member.call(this, value);
            } else {
                throw new Error("Unable to set property: " + name);
            }
        }
    };

    nx.extend(NXObject, {
        prototype: NXPrototype,
        __meta__: {},
        __nx__: true,
        __id__: nx.serial(),
        __namespace__: NXPrototype.__namespace__,
        __methods__: NXPrototype.__methods__,
        __properties__: NXPrototype.__properties__,
        __ctor_idle__: true,
        __mixins__: [],
        __initializers__: [],
        IDLE_RESOURCE: {
            release: nx.idle
        },
        /**
         * Define a property and attach to target.
         * @method extendProperty
         * @static
         * @param target {Object}
         * @param name {String}
         * @param meta {Object}
         * @param immediate {Boolean} Optional. Apply the value immediately after extend the propery or not. Default false.
         */
        extendProperty: function extendProperty(target, name, meta, immediate) {
            if (nx.is(meta, nx.binding) || !nx.is(meta, "Object")) {
                meta = {
                    value: meta
                };
            }
            var property;
            // prepare meta of property
            var _name, binding, initializer;
            _name = "_" + name;
            if (meta.value instanceof nx.binding) {
                binding = meta.value;
            } else if ((meta.dependencies || meta.async) && (!hasown.call(meta, "value") || typeof meta.value === "function")) {
                binding = nx.binding({
                    paths: nx.is(meta.dependencies, "String") ?
                        meta.dependencies.replace(/\s/g, "").split(",") : meta.dependencies,
                    async: meta.async,
                    handler: (typeof meta.value === "function") && meta.value
                });
            } else {
                // actually not a binding
                binding = meta.value;
            }
            // access creator
            var accessor = function() {
                return function(value, params) {
                    if (value === undefined && arguments.length === 0) {
                        return property.__getter__ ?
                            property.__getter__.call(this) :
                            this[_name];
                    } else {
                        var oldValue = property.__getter__ ?
                            property.__getter__.call(this) :
                            this[_name];
                        if (property.__equal__ ? property.__equal__(oldValue, value) : (oldValue !== value)) {
                            if (property.__setter__) {
                                if (property.__setter__.call(this, value, params) !== false && this.__watchers__[name]) {
                                    this.notify(name, oldValue);
                                }
                            } else {
                                this[_name] = value;
                                this.__watchers__[name] && this.notify(name, oldValue);
                            }
                        }
                        return value;
                    }
                };
            };
            // create or update property
            if (typeof target[name] !== "function") {
                property = accessor();
                nx.extend(property, {
                    __type__: "property",
                    __name__: name,
                    __meta__: nx.extend({}, meta),
                    __binding__: binding,
                    __getter__: meta.get,
                    __setter__: meta.set,
                    __equal__: (typeof meta.equalityCheck === "function") && meta.equalityCheck,
                    __watchers__: typeof meta.watcher === "function" ? [meta.watcher] : []
                });
                target[name] = property;
            } else {
                // property already exists
                if (hasown.call(target, name)) {
                    property = target[name];
                } else {
                    property = accessor();
                    nx.extend(property, {
                        __type__: "property",
                        __name__: name,
                        __meta__: nx.extend({}, meta),
                        __binding__: target[name].__binding__,
                        __get__: target[name].__get__,
                        __set__: target[name].__set__,
                        __equal__: target[name].__equal__,
                        __watchers__: target[name].__watchers__.slice()
                    });
                    target[name] = property;
                }
                if (property.__type__ !== "property") {
                    // TODO report an exception
                    return;
                }
                if (binding || hasown.call(meta, "value") && meta.value === binding) {
                    // FIXME think about how to inherit a binding
                    property.__binding__ = binding;
                }
                if (meta.get) {
                    meta.get.__super__ = property.__getter__;
                    property.__getter__ = meta.get;
                }
                if (meta.set) {
                    meta.set.__super__ = property.__setter__;
                    property.__setter__ = meta.set;
                }
                if (typeof meta.equalityCheck === "function") {
                    property.__equal__ = meta.equalityCheck;
                }
                if (typeof meta.watcher === "function") {
                    property.__watchers__.push(meta.watcher);
                }
            }

            target.__properties__[name] = property.__meta__;

            initializer = {
                initialize: function() {
                    var property = this[name];
                    var resource, value;
                    value = typeof property.__binding__ === "function" ? property.__binding__.call(this) : property.__binding__;
                    if (value instanceof nx.binding) {
                        resource = NXObject.affectBinding(this, name, value);
                        this.retain(resource);
                    } else if (hasown.call(meta, "value")) {
                        property.call(this, value);
                    }
                    var i, n = property.__watchers__.length;
                    for (var i = 0; i < n; i++) {
                        this.retain(this.watch(name, property.__watchers__[i]));
                    }
                }
            };

            if (immediate) {
                initializer.initialize.call(target);
            }
            return initializer;
        },
        /**
         * Define a method and attach to target.
         * @method extendMethod
         * @static
         * @param target {Object}
         * @param name {String}
         * @param method {Function}
         */
        extendMethod: function extendMethod(target, name, method) {
            var exist = target[name] && target[name].__type__ == 'method';

            if (target[name] && target[name] !== method) {
                method.__super__ = target[name];
            }

            method.__name__ = name;
            method.__type__ = 'method';
            method.__meta__ = {};

            target[name] = method;
            target.__methods__[name] = method;
        },
        /**
         * Recursively affect a binding, and call the callback with final result.
         * The operator of asynchronize binding could be extend for more information.
         * 
         * @method binding
         * @static
         * @param context {nx.Object}
         * @param binding {nx.binding}
         * @param callback {Function} For handling the final result.
         * @param extend {Object} Extension of asynchronize operator.
         */
        binding: function(context, binding, callback, extend) {
            if (!binding) {
                return NXObject.IDLE_RESOURCE;
            }
            var operator, resources = new NXObject;
            // create an operator of the asynchronize operator
            operator = nx.extend({}, extend, {
                set: function(value, param) {
                    resources.release("recursive");
                    if (value instanceof nx.binding) {
                        resources.retain("recursive", NXObject.binding(context, value, callback, extend));
                    } else {
                        return callback.call(context, value, param);
                    }
                }
            });
            // to call or bind the handler
            if (!binding.paths || !binding.paths.length) {
                if (binding.async && binding.handler) {
                    resources.retain("async", binding.handler.call(context, operator));
                } else {
                    operator.set(binding.handler ?
                        binding.handler.call(context) :
                        nx.path(context, binding.paths[0]));
                }
            } else {
                // to bind the handler asynchronizely or not
                if (binding.async && binding.handler) {
                    resources.retain(NXObject.cascade(context, binding.paths, function() {
                        var args = slice.call(arguments);
                        args.unshift(operator);
                        resources.retain("async", binding.handler.apply(context, args));
                    }));
                } else {
                    resources.retain(NXObject.cascade(context, binding.paths, function(value0) {
                        operator.set(binding.handler ?
                            binding.handler.apply(context, arguments) :
                            value0);
                    }));
                }
            }
            return resources;
        },
        /**
         * Affect a binding to an property.
         * @static
         * @method affectBinding
         * @param target The target object.
         * @param path The binding to be affect.
         * @return Resource stub object, with release and affect methods.
         *  <p>release: unwatch the current watching.</p>
         *  <p>affect: invoke the callback with current value immediately.</p>
         */
        affectBinding: function(target, name, binding) {
            var resource, recursive, operator, property = target[name];
            if (property) {
                return NXObject.binding(target, binding, property, {
                    get: property.bind(target)
                });
            }
            return NXObject.IDLE_RESOURCE;
        },
        /**
         * This method in order to watch the change of specified path of specified target.
         * @static
         * @method watch
         * @param target The target observable object.
         * @param path The path to be watched.
         * @param callback The callback function accepting arguments list: (path, newvalue, oldvalue).
         * @param context (Optional) The context which the callback will be called with.
         * @return Resource stub object, with release and affect methods.
         *  <p>release: unwatch the current watching.</p>
         *  <p>affect: invoke the callback with current value immediately.</p>
         */
        watch: function(target, path, callback, context) {
            var keys = (typeof path === "string" ? path.replace(/\s/g, "").split(".") : path);
            var iterate = function(value, oldValue, keys) {
                if (!value) {
                    return callback.call(context || target, path, value, nx.path(oldValue, keys));
                }
                if (!keys.length) {
                    return callback.call(context || target, path, value, oldValue);
                }
                if (nx.is(value, nx.Object)) {
                    return value.watch(keys[0], function(key, value, oldValue) {
                        return iterate(value, oldValue, keys.slice(1));
                    });
                } else {
                    return iterate(nx.path(value, keys[0]), nx.path(oldValue, keys[0]), keys.slice(1));
                }
            };
            return iterate(target, undefined, keys);
        },
        /**
         * Cascade several paths of target at the same time, any value change of any path will trigger the callback with all values of all paths.
         * @static
         * @method cascade
         * @param target The target observable object.
         * @param pathlist The path list to be watched.
         * @param callback The callback function accepting arguments list: (value1, value2, value3, ..., changed_path, changed_old_value).
         * @return The cascading resource retaining all sub-bindings.
         *  <p>release: release the current cascading.</p>
         *  <p>affect: invoke the callback with current values immediately.</p>
         */
        cascade: function(target, pathlist, callback, context) {
            if (!target || !pathlist || !callback) {
                return;
            }
            // apply the cascading
            var resources = new nx.Object();
            var i, paths, values;
            paths = typeof pathlist === "string" ? pathlist.replace(/\s/g, "").split(",") : pathlist;
            values = [];
            var affect = function(path, oldValue) {
                var args = values.slice();
                if (path) {
                    args.push(path, oldValue);
                }
                callback.apply(context || target, args);
            };
            nx.each(paths, function(path, idx) {
                values[idx] = nx.path(target, path);
            });
            nx.each(paths, function(path, idx) {
                resources.retain(NXObject.watch(target, paths[idx], function(path, value) {
                    var oldValue = values[idx];
                    // TODO TBD: what if not changed but notified?
                    if (oldValue !== value) {
                        values[idx] = value;
                        affect(paths[idx], oldValue);
                    }
                }));
            });
            affect(null, null);
            return resources;
        }
    });

    nx.Object = NXObject;

})(nx);
(function(nx) {

    var global = nx.global;

    var apply_meta = function(Class, meta) {
        // resolve mixins if given by Class
        var mixins = meta.mixins;
        if (!nx.is(mixins, "Array")) {
            mixins = (typeof mixins === "function" ? [mixins] : []);
        }
        // apply each mixins
        var prototype = Class.prototype;
        nx.each(mixins, function(mixin) {
            if (prototype.__mixins__.indexOf(mixin) === -1) {
                prototype.__mixins__.push(mixin);
                apply_meta(Class, mixin.__meta__);
            }
        });
        // methods on prototype
        nx.each(meta.methods, function(method, name) {
            if (name !== "init") {
                // TODO forbid final methods, e.g. retain, release, on, fire, watch, notify, etc.
                nx.Object.extendMethod(prototype, name, method);
            }
        });
        // TODO order properties' initializers by dependencies
        nx.each(meta.properties, function(property, name) {
            var initializer = nx.Object.extendProperty(prototype, name, property);
            Class.__initializers__.push(initializer);
        });
    };

    /**
     * Define a class.
     * @method define
     * @param pathname {String}
     *  The target package name. Optional, default no package name.
     * @param parent {Function}
     *  The super class. Optional, default nx.Object.
     * @param meta {Object}
     *  The definition of the class
     * @return {Function|Object}
     *  The defined class or instance (if static).
     */
    function define(pathname, parent, meta) {
        var Class, classname;

        // optinalize arguments
        if (!meta) {
            if (!parent) {
                meta = pathname || {};
                parent = nx.Object;
                pathname = null;
            } else if (typeof pathname !== "string") {
                meta = parent;
                parent = pathname;
                pathname = null;
            } else {
                meta = parent;
                parent = nx.Object;
            }
        } else if (!parent) {
            // TODO report an error for undefined parent class
            parent = nx.Object;
        }

        // FIXME for capability
        if (meta && meta.static) {
            meta = nx.extend({}, meta);
            delete meta.static;
            return singleton(pathname, parent, meta);
        }

        // create class
        Class = function NXObject(sign) {
            // make sure it's "newing"
            if (!this instanceof arguments.callee) {
                return nx.factory(arguments.callee, arguments);
            }
            // ignore initialization if marked as idle
            if (sign instanceof nx.idle) {
                return;
            }
            // get the real arguments
            var args = arguments[0];
            if (Object.prototype.toString.call(args) !== "[object Arguments]") {
                args = arguments;
            }

            this.__initializing__ = true;

            // to prevent duplicated initialization, make a map of initialized types
            this.__type_initialized__ = {};
            this.__ctor__.apply(this, args);
            delete this.__type_initialized__;

            this.__initializing__ = false;
        };

        // if textual class name is asked, make Class to use correct class name, instead of unified NXObject
        if (nx.TEXTUAL) {
            classname = pathname ? pathname.split(".").pop() : "Anonymous";
            nx.define.cutpoint = nx.define.cutpoint || (function NXObject() {}).toString().indexOf("(");
            Class = eval(["(function ", classname, Class.toString().substring(nx.define.cutpoint), ")"].join(""));
        }

        var prototype, mixins, initializers, init, init_meta, init_super;
        mixins = (parent.__ctor_idle__ ? parent.__mixins__.slice() : []);
        mixins = nx.is(meta.mixins, "Array") ?
            mixins.concat(meta.mixins) :
            mixins.concat(typeof meta.mixins === "function" ? [meta.mixins] : []);
        initializers = parent.__ctor_idle__ ? parent.__initializers__.slice() : [];
        init_super = (parent.__ctor__ && parent.__ctor_idle__) ? parent.__ctor__.__super__ : parent.__ctor__;
        init_meta = init = meta.methods && meta.methods.init;
        // create init method if not exists
        if (!init) {
            init = function init() {
                this.inherited(arguments);
            };
        }
        // markup the init methods
        nx.extend(init, {
            __type__: "method",
            __name__: "init",
            __class__: Class,
            __super__: init_super
        });
        // makeup the prototype
        prototype = (function() {
            var Super = function() {};
            Super.prototype = parent.prototype;
            return new Super();
        })();
        nx.extend(prototype, {
            constructor: Class,
            __nx__: true,
            __class__: Class,
            __super__: parent,
            __ctor__: init,
            __properties__: nx.extend({}, prototype.__properties__),
            __methods__: nx.extend({}, prototype.__methods__),
            __mixins__: prototype.__mixins__.slice()
        });
        // markup the class
        nx.extend(Class, meta.statics);
        nx.extend(Class, {
            prototype: prototype,
            __nx__: true,
            __id__: nx.serial(),
            __meta__: meta,
            __super__: prototype.__super__,
            __ctor__: init,
            __ctor_idle__: !init_meta,
            __mixins__: mixins,
            __initializers__: initializers
        });
        // apply meta
        apply_meta(Class, meta);
        // update namespace
        if (pathname) {
            Class.__namespace__ = pathname;
            prototype.__namespace__ = pathname;
            nx.path(nx.global, pathname, Class);
        }
        // return the class
        return Class;
    }

    function singleton(pathname, parent, meta) {
        if (pathname && typeof pathname !== "string") {
            meta = parent;
            parent = pathname;
            pathname = null;
        }
        if (typeof parent !== "function") {
            meta = parent;
            parent = nx.Object;
        }
        var Class = define(parent, meta);
        var instance = new Class();
        if (pathname) {
            nx.path(nx.global, pathname, instance);
        }
        return instance;
    }

    nx.define = define;
    nx.singleton = singleton;

})(nx);
(function (nx) {

    var tostr = Object.prototype.toString;
    var hasown = Object.prototype.hasOwnProperty;

    /**
     * @class Map
     * @namespace nx
     */
    var EXPORT = nx.define("nx.Map", {
        methods: {
            init: function (map) {
                this.inherited();
                this._nummap = {};
                this._strmap = {};
                this._nxomap = {};
                this._objmap = [];
                // initialize
                if (nx.is(map, EXPORT)) {
                    map.each(function (value, key) {
                        this.set(key, value);
                    }, this);
                } else {
                    var key;
                    for (key in map) {
                        this.set(key, map[key]);
                    }
                }
            },
            /**
             * Clear all handling things.
             *
             * @method clear
             */
            clear: function () {
                delete this._undefined;
                delete this._null;
                delete this._true;
                delete this._false;
                this._nummap = {};
                this._strmap = {};
                this._nxomap = [];
                this._objmap = [];
                this.fire("change", {
                    action: "clear"
                });
            },
            /**
             * Check if specified key has value stored in the map.
             *
             * @method has
             * @param {Any} key The key.
             * @return {Boolean} Has or not.
             */
            has: function (key) {
                // check the type
                if (key === null) {
                    return hasown.call(this, "_null");
                } else if (key === undefined) {
                    return hasown.call(this, "_undefined");
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        return hasown.call(this, "_null");
                    case "[object Boolean]":
                        return hasown.call(this, key ? "_true" : "_false");
                    case "[object Undefined]":
                        return hasown.call(this, "_undefined");
                    case "[object Number]":
                        return hasown.call(this._nummap, key);
                    case "[object String]":
                        return hasown.call(this._strmap, key);
                    default:
                        if (key.__id__) {
                            return hasown.call(this._nxomap, key.__id__);
                        } else {
                            return !!EXPORT.getArrayMapItem(this._objmap, key);
                        }
                    }
                }
            },
            /**
             * Remove specified key.
             *
             * @method remove
             * @param {Any} key The key.
             */
            remove: function (key) {
                // XXX optimizable for obj-map
                var previousValue = this.get(key);
                // check the type
                if (key === null) {
                    delete this._null;
                } else if (key === undefined) {
                    delete this._undefined;
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        delete this._null;
                    case "[object Undefined]":
                        return this._undefined;
                    case "[object Boolean]":
                        if (key) {
                            delete this._true;
                        } else {
                            delete this._false;
                        }
                    case "[object Number]":
                        delete this._nummap[key];
                    case "[object String]":
                        delete this._strmap[key];
                    default:
                        if (key.__id__) {
                            delete this._nxomap[key.__id__];
                        } else {
                            EXPORT.removeArrayMapItem(this._objmap, key);
                        }
                    }
                }
                this.fire("change", {
                    action: "remove",
                    key: key,
                    previousValue: previousValue
                });
                return previousValue;
            },
            /**
             * Get value of specified key.
             *
             * @method get
             * @param {Any} key The key.
             * @return Value
             */
            get: function (key) {
                // check the type
                if (key === null) {
                    return this._null;
                } else if (key === undefined) {
                    return this._undefined;
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        return this._null;
                    case "[object Boolean]":
                        return key ? this._true : this._false;
                    case "[object Undefined]":
                        return this._undefined;
                    case "[object Number]":
                        return this._nummap[key];
                    case "[object String]":
                        return this._strmap[key];
                    default:
                        if (key.__id__) {
                            return (this._nxomap[key.__id__] || {}).value;
                        } else {
                            return EXPORT.getArrayMapValue(this._objmap, key);
                        }
                    }
                }
            },
            /**
             * Set value of specified key.
             *
             * @method set
             * @param {Any} key The key.
             * @param {Number} value The value to be set.
             * @return Final value
             */
            set: function (key, value) {
                // XXX optimizable for obj-map
                var previousValue = this.get(key);
                // check if change happening
                if (previousValue === value) {
                    return value;
                }
                // change value
                if (key === null) {
                    this._null = value;
                } else if (key === undefined) {
                    this._undefined = value;
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        this._null = value;
                        break;
                    case "[object Boolean]":
                        if (key) {
                            this._true = value;
                        } else {
                            this._false = value;
                        }
                        break;
                    case "[object Undefined]":
                        this._undefined = value;
                        break;
                    case "[object Number]":
                        this._nummap[key] = value;
                        break;
                    case "[object String]":
                        this._strmap[key] = value;
                        break;
                    default:
                        if (key.__id__) {
                            this._nxomap[key.__id__] = {
                                key: key,
                                value: value
                            };
                        } else {
                            EXPORT.setArrayMapValue(this._objmap, key, value);
                        }
                        break;
                    }
                }
                // trigger events
                this.fire("change", {
                    action: "set",
                    key: key,
                    previousValue: previousValue,
                    value: value
                });
                return value;
            },
            /**
             * Iterate all key-value pairs.
             *
             * @method each
             * @param fn The callback for each key-value pair
             * @return
             */
            each: function (fn, context) {
                if (hasown.call(this, "_undefined")) {
                    if (fn.call(context, this._undefined, undefined) === false) {
                        return false;
                    }
                }
                if (hasown.call(this, "_null")) {
                    if (fn.call(context, this._null, null) === false) {
                        return false;
                    }
                }
                if (hasown.call(this, "_true")) {
                    if (fn.call(context, this._true, true) === false) {
                        return false;
                    }
                }
                if (hasown.call(this, "_false")) {
                    if (fn.call(context, this._false, false) === false) {
                        return false;
                    }
                }
                var k, v, len;
                for (k in this._nummap) {
                    if (fn.call(context, this._nummap[k], Number(k)) === false) {
                        return false;
                    }
                }
                for (k in this._strmap) {
                    if (fn.call(context, this._strmap[k], k) === false) {
                        return false;
                    }
                }
                for (k in this._nxomap) {
                    v = this._nxomap[k];
                    if (fn.call(context, v.value, v.key) === false) {
                        return false;
                    }
                }
                for (k = 0, len = this._objmap.length; k < len; k++) {
                    v = this._objmap[k];
                    if (fn.call(context, v.value, v.key) === false) {
                        return false;
                    }
                }
            },
            /**
             * Apply a diff watcher, which handles each key-item-pair in the collection, to the dictionary.
             *
             * @method monitor
             * @param handler lambda(key, item) returning a rollback method
             * @return unwatcher A Object with unwatch method.
             */
            monitor: function (callback, context) {
                var map = this;
                var resources = new nx.Map();
                var listener = map.on("change", function (target, evt) {
                    var res;
                    switch (evt.action) {
                    case "set":
                        res = resources.get(evt.key);
                        res && res.release();
                        res = callback.call(context, evt.key, evt.value, evt.previousValue);
                        res && resources.set(evt.key, {
                            release: res
                        });
                        break;
                    case "remove":
                        res = resources.get(evt.key);
                        res && res.release();
                        break;
                    case "clear":
                        resources.each(function (res, key) {
                            res && res.release();
                        });
                        resources.clear();
                        break;
                    }
                });
                map.each(function (value, key) {
                    var res = callback.call(context, key, value);
                    res && resources.set(key, res);
                });
                return {
                    release: function () {
                        if (listener) {
                            resources.each(function (res, key) {
                                res && res.release();
                            });
                            resources.clear();
                            listener.release();
                            listener = null;
                        }
                    }
                };
            },
            cascade: function (keys, callback, context) {
                if (typeof keys === "string") {
                    keys = keys.replace(/\s/g, "").split(",");
                }
                var self = this;
                var values, resource;
                values = [];
                nx.each(keys, function (key) {
                    values.push(this.get(key));
                }, this);
                var listener = this.on("change", function (map, evt) {
                    var idx, vals;
                    switch (evt.action) {
                    case "set":
                    case "remove":
                        idx = keys.indexOf(evt.key);
                        if (idx >= 0 && values[idx] !== evt.value) {
                            values[idx] = evt.value;
                            vals = values.slice();
                            vals.push(evt.key, evt.previousValue);
                            callback.apply(context, vals);
                        }
                        break;
                    case "clear":
                        callback.call(context);
                        break;
                    }
                });
                callback.apply(context, values);
                return {
                    release: function () {
                        if (listener) {
                            listener.release();
                            listener = null;
                        }
                    }
                };
            },
            __each__: function (fn, context) {
                return this.each(fn, context);
            },
            __get__: function (key) {
                if (this[key] && this[key].__type__ === "property") {
                    return this[key].call(this);
                } else {
                    return this.get(key);
                }
            },
            __set__: function (key, value) {
                if (this[key] && this[key].__type__ === "property") {
                    return this[key].call(this, value);
                } else {
                    return this.set(key, value);
                }
            }
        },
        statics: {
            getArrayMapItem: function (map, key) {
                return map.filter(function (item) {
                    return item.key === key;
                })[0];
            },
            removeArrayMapItem: function (map, key) {
                nx.each(map, function (item, idx) {
                    if (item.key === key) {
                        map.splice(idx, 1);
                        return false;
                    }
                });
            },
            getArrayMapValue: function (map, key) {
                return (EXPORT.getArrayMapItem(map, key) || {}).value;
            },
            setArrayMapValue: function (map, key, value) {
                var item = EXPORT.getArrayMapItem(map, key);
                if (!item) {
                    map.push({
                        key: key,
                        value: value
                    });
                } else {
                    item.value = value;
                }
                return value;
            }
        }
    });

})(nx);
(function (nx) {

    nx.define("nx.Counter", nx.Map, {
        methods: {
            init: function () {
                this.inherited(arguments);
                this.on("change", function (sender, evt) {
                    var ov = evt.previousValue || 0;
                    var nv = evt.value || 0;
                    var change = {
                        item: evt.key,
                        previousCount: ov,
                        count: nv
                    };
                    if (ov < nv) {
                        this.fire("increase", change);
                    }
                    if (ov > nv) {
                        this.fire("decrease", change);
                    }
                    this.fire("count", change);
                });
            },
            get: function (key) {
                return this.inherited(key) || 0;
            },
            /**
             * Increase the count of given item.
             *
             * @method increase
             * @param {Any} item The item to count.
             * @param {Number} increment The increment, default 1.
             * @return The increasing result
             */
            increase: function (item, increment) {
                increment = arguments.length > 1 ? Math.floor(increment * 1 || 0) : 1;
                var value = this.get(item) + increment;
                if (value) {
                    return this.set(item, this.get(item) + increment);
                } else {
                    this.remove(item);
                    return 0;
                }
            },
            /**
             * Decrease the count of given item.
             *
             * @method decrease
             * @param {Any} item The item to count.
             * @param {Number} decrement The decrement, default 1.
             * @return The decreasing result
             */
            decrease: function (item, decrement) {
                decrement = arguments.length > 1 ? Math.floor(decrement * 1 || 0) : 1;
                var value = this.get(item) - decrement;
                if (value) {
                    return this.set(item, value);
                } else {
                    this.remove(item);
                    return 0;
                }
            }
        }
    });

})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    var REGEXP_CHECK = /^(&&|\|\||&|\||\^|-|\(|\)|[a-zA-Z\_][a-zA-Z\d\_]*|\s)*$/;
    var REGEXP_TOKENS = /&&|\|\||&|\||\^|-|\(|\)|[a-zA-Z\_][a-zA-Z\d\_]*/g;
    var REGEXP_OPN = /[a-zA-Z\_][a-zA-Z\d\_]*/;
    var REGEXP_OPR = /&&|\|\||&|\||\^|-|\(|\)/;
    var OPERATORNAMES = {
        "-": "complement",
        "&": "cross",
        "^": "delta",
        "|": "union",
        "&&": "and",
        "||": "or"
    };

    /**
     * @class List
     * @namespace nx
     */
    var EXPORT = nx.define("nx.List", {
        properties: {
            length: {
                set: function() {
                    throw new Error("Unable to set length of List");
                }
            },
            data: {
                set: function() {
                    throw new Error("Unable to set data of List");
                }
            }
        },
        methods: {
            /**
             * @constructor
             * @param data {Array|List} Initial list.
             */
            init: function(data) {
                this.inherited();
                // optimize
                this._counting_map = new nx.Counter();
                this._counting_num = 0;
                this._counting_res = null;
                // initialize
                this._length = 0;
                this._data = [];
                if (nx.is(data, "Array")) {
                    this.spliceAll(0, 0, data.slice());
                } else if (nx.is(data, EXPORT)) {
                    this.spliceAll(0, 0, data._data.slice());
                }
            },
            /**
             * To Array.
             *
             * @method toArray
             * @return An array with the whole list data.
             */
            toArray: function() {
                return this._data.slice();
            },
            /**
             * Create a sub list from specified start position and length.
             *
             * @method slice
             * @param start Optional. Default 0.
             * @param end Optional. Default the current length of list.
             * @return A difference-object.
             */
            slice: function(start, end) {
                return new EXPORT(slice.call(this._data, start, end));
            },
            /**
             * Get the value at speicified position.
             *
             * @method get
             * @param index The index of value to be get.
             * @return value
             */
            get: function(index) {
                if (index >= 0) {
                    return this._data[index];
                } else if (index < 0) {
                    return this._data[this._data.length + index];
                }
            },
            /**
             * Iterate all values and indices in the list.
             *
             * @method each
             * @param callback The callback for each value.
             * @param context (Optional)
             * @return False if the iteration stoped by returning false in the callback.
             */
            each: function(callback, context) {
                return nx.each(this._data, callback, context);
            },
            __each__: function(callback, context) {
                return nx.each(this._data, callback, context);
            },
            /**
             * Check the list containing a value or not.
             *
             * @method contains
             * @param value
             * @return Containing or not.
             */
            contains: function(value) {
                return this._data.indexOf(value) >= 0;
            },
            /**
             * Find the first index of a value.
             *
             * @method indexOf
             * @return The index value, -1 if not found
             */
            indexOf: function(value, since) {
                return this._data.indexOf(value, since);
            },
            /**
             * Find the last index of a value.
             *
             * @method lastIndexOf
             * @param value The value attemp to find
             * @param since The start point.
             * @return The index value, -1 if not found
             */
            lastIndexOf: function(value, since) {
                if (since === undefined) {
                    return this._data.lastIndexOf(value);
                } else {
                    return this._data.lastIndexOf(value, since);
                }
            },
            /**
             * Find an item that matches the check function.
             *
             * @method fn The match function
             * @return The item.
             */
            find: function(fn) {
                if (this._data.find) {
                    return this._data.find(fn);
                } else {
                    var i;
                    for (i = 0; i < this._data.length; i++) {
                        if (fn(this._data[i])) {
                            return this._data[i];
                        }
                    }
                }
            },
            /**
             * Find an item that matches the check function, and returns its index.
             *
             * @method fn The match function
             * @return The index, -1 if not found.
             */
            findIndex: function(fn) {
                if (this._data.find) {
                    return this._data.findIndex(fn);
                } else {
                    var i;
                    for (i = 0; i < this._data.length; i++) {
                        if (fn(this._data[i])) {
                            return i;
                        }
                    }
                    return -1;
                }
            },
            /**
             * Add variable number of items at the tail of list.
             *
             * @method push
             * @return New length.
             */
            push: function() {
                this.spliceAll(this._data.length, 0, slice.call(arguments));
                return this._data.length;
            },
            /**
             * Add an array of items at the tail of list.
             *
             * @method pushAll
             * @return New length.
             */
            pushAll: function(items) {
                this.spliceAll(this._data.length, 0, items);
                return this._data.length;
            },
            /**
             * Remove the last item at the head of list.
             *
             * @method pop
             * @return The pop item.
             */
            pop: function() {
                return this.spliceAll(this._data.length - 1, 1, [])[0];
            },
            /**
             * Insert variable number of items at the head of list.
             *
             * @method unshift
             * @return New length.
             */
            unshift: function() {
                this.spliceAll(0, 0, slice.call(arguments));
                return this._data.length;
            },
            /**
             * Insert an array of items at the head of list.
             *
             * @method unshift
             * @return New length.
             */
            unshiftAll: function(items) {
                this.spliceAll(0, 0, items);
                return this._data.length;
            },
            /**
             * Remove the first item at the head of list.
             *
             * @method shift
             * @return The shift item.
             */
            shift: function() {
                return this.spliceAll(0, 1, [])[0];
            },
            /**
             * Remove specified count of items from specified start position, and insert variable number of items at the position.
             *
             * @method splice
             * @param offset Optional. Default 0.
             * @param count Optional. Default the current length of list.
             * @param items... Variable. The items gonna be inserted.
             * @return A difference-object.
             */
            splice: function(offset, count) {
                return this.spliceAll(offset, count, slice.call(arguments, 2));
            },
            /**
             * Remove specified count of items from specified start position, and insert variable number of items at the position.
             *
             * @method spliceAll
             * @param offset Optional. Default 0.
             * @param count Optional. Default the current length of list.
             * @param items... Variable. The items gonna be inserted.
             * @return droped items.
             */
            spliceAll: function(offset, count, items) {
                // follow Array.prototype.splice
                if (offset < 0) {
                    offset = this._length + offset;
                }
                if (count < 0) {
                    count = 0;
                }
                if (offset + count > this._length) {
                    if (offset > this._length) {
                        offset = this._length;
                    }
                    count = this._length - offset;
                }
                // do splice by differ
                var removement = this.differ([
                    ["splice", offset, count, items]
                ]);
                return removement.drops[0];
            },
            /**
             * Remove all specified value, including duplicated, in the list.
             *
             * @method remove
             * @param value... The value to be cleared.
             * @return Removed count.
             */
            remove: function() {
                return this.removeAll(slice.call(arguments));
            },
            /**
             * Remove all specified value, including duplicated, in the list.
             *
             * @method remove
             * @param value... The value to be cleared.
             * @return Removed count.
             */
            removeAll: function(values) {
                if (!values) {
                    return this.clear().length;
                }
                var count = 0;
                var i, idx, value, diffs = [];
                for (i = 0; i < values.length; i++) {
                    value = values[i];
                    while ((idx = this.indexOf(value, idx + 1)) >= 0) {
                        diffs.push(["splice", idx, 1, []]);
                        count++;
                    }
                }
                diffs.sort(function(a, b) {
                    return b[1] - a[1];
                });
                this.differ(diffs);
                return count;
            },
            /**
             * Remove all items in the list.
             *
             * @method clear
             * @return Removed items.
             */
            clear: function() {
                var differ = this.differ([
                    ["splice", 0, this._length, []]
                ]);
                return differ.drops[0];
            },
            /**
             * Set the existence of a value in the list.
             *
             * @method toggle
             * @param value The value whose existence attempt to be toggled.
             * @param existence (Optional) Default hasnot(value).
             */
            toggle: function(value, existence) {
                if (arguments.length > 1) {
                    if (!existence) {
                        this.remove(value);
                    } else if (this.indexOf(value) < 0) {
                        this.push(value);
                    }
                    return existence;
                } else {
                    if (this.indexOf(value) >= 0) {
                        this.remove(value);
                        return false;
                    } else {
                        this.push(value);
                        return true;
                    }
                }
            },
            /**
             * Set the index of an item, splice if not exist yet.
             *
             * @method setIndex
             * @param item The value about to move
             * @param index (Optional) Default hasnot(value).
             * @return The final index
             */
            setIndex: function(item, index) {
                var indexFrom = this.indexOf(item);
                if (indexFrom === -1) {
                    var differ = this.differ([
                        ["splice", index, 0, [item]]
                    ]);
                    return differ.diffs[0][1];
                } else {
                    return indexFrom + this.move(indexFrom, 1, index - indexFrom);
                }
            },
            /**
             * Set the existence of a value in the list.
             *
             * @method setIndexAt
             * @param value The value whose existence attempt to be toggled.
             * @param existence (Optional) Default hasnot(value).
             */
            setIndexAt: function(from, index) {
                var len = this._length;
                // check from
                from < 0 && (from = len + from);
                if (from < 0 || from >= len) {
                    // bad from moves nothing
                    return 0;
                }
                return from + this.move(from, 1, index - from);
            },
            /**
             * Specify an area of items and move it backward/forward.
             *
             * @method setIndexAt
             * @param offset The lower-bound of the area
             * @param count The size of the area
             * @param delta The delta of the moving
             * @return The delta actually moved
             */
            move: function(offset, count, delta) {
                var movement, len = this._length;
                // check offset
                offset < 0 && (offset = len + offset);
                if (offset < 0 || offset >= len) {
                    // bad offset moves nothing
                    return 0;
                }
                // check count
                if (offset + count > len) {
                    count = len - offset;
                } else if (count < 0) {
                    if (offset + count < 0) {
                        count = offset;
                        offset = 0;
                    } else {
                        count = -count;
                        offset = offset - count;
                    }
                }
                if (count <= 0) {
                    // bad count moves nothing
                    return 0;
                }
                // check delta
                if (offset + count + delta > len) {
                    delta = len - offset - count;
                } else if (offset + delta < 0) {
                    delta = -offset;
                }
                if (delta === 0) {
                    // bad count moves nothing
                    return 0;
                }
                movement = delta;
                if (delta < 0) {
                    // swap count and delta
                    count = delta - count;
                    delta = delta - count;
                    count = delta + count;
                    // fix count and offset
                    count = -count;
                    offset -= count;
                }
                // apply the differ of move
                this.differ([
                    ["move", offset, count, delta]
                ]);
                return movement;
            },
            /**
             * Apply an array of differences to the list, getting the droped items.
             *
             * @method differ
             * @param diffs The differences
             * @return droped items.
             */
            differ: function(diffs) {
                var length = this._length;
                var evt = this._differ(diffs);
                if (evt && evt.diffs.length) {
                    this.fire("diff", evt);
                    if (length !== this._data._length) {
                        this._length = this._data.length;
                        this.notify("length");
                    }
                }
                return evt;
            },
            _differ: function(diffs) {
                var drops = [];
                var joins = [];
                nx.each(diffs, function(diff) {
                    switch (diff[0]) {
                        case "splice":
                            drops.push(nx.func.apply(splice, this._data, diff[1], diff[2], diff[3]));
                            joins.push(diff[3]);
                            break;
                        case "move":
                            // ["move", offset, count, delta]
                            nx.func.apply(splice, this._data, diff[1] + diff[3], 0,
                                this._data.splice(diff[1], diff[2]));
                            drops.push([]);
                            joins.push([]);
                    }
                }, this);
                return {
                    diffs: diffs || [],
                    drops: drops,
                    joins: joins
                };
            },
            _counting_register: function() {
                this._counting_num++;
                var map = this._counting_map;
                if (this._counting_num > 0) {
                    if (!this._counting_res) {
                        // refresh counting map
                        map.clear();
                        nx.each(this._data, function(value) {
                            map.increase(value);
                        });
                        // add monitor of counting
                        this._counting_res = this.on("diff", function(sender, evt) {
                            var mapdelta = new nx.Counter();
                            var i, diff, drop, join;
                            var diffs, drops, joins;
                            diffs = evt.diffs, drops = evt.drops, joins = evt.joins;
                            for (i = 0; i < diffs.length; i++) {
                                diff = diffs[i], drop = drops[i], join = joins[i];
                                // consider removement and addition has no cross item
                                nx.each(drop, function(value) {
                                    mapdelta.decrease(value);
                                });
                                nx.each(join, function(value) {
                                    mapdelta.increase(value);
                                });
                            }
                            // apply delta map
                            var change = [];
                            mapdelta.each(function(delta, value) {
                                if (delta > 0 || delta < 0) {
                                    map.increase(value, delta);
                                    change.push({
                                        value: value,
                                        count: map.get(value)
                                    });
                                }
                            });
                            // fire event
                            this.fire("counting", change);
                        }, this);
                    }
                }
                return {
                    release: function() {
                        // FIXME logical fault on multiple release
                        this._counting_num--;
                        if (this._counting_num <= 0) {
                            if (this._counting_res) {
                                this._counting_res.release();
                                this._counting_res = null;
                            }
                        }
                    }.bind(this)
                };
            },
            /**
             * Supplies a whole life-cycle of a monitoring on a list.
             *
             * @method monitorDiff
             * @param handler lambda(diff) handling diff events.
             * @return releaser A Object with release method.
             */
            monitorDiff: function(handler, context) {
                var self = this;
                var data = this._data.slice();
                if (data.length) {
                    handler.call(context, {
                        diffs: Array(["splice", 0, 0, data]),
                        drops: Array([]),
                        joins: [data]
                    });
                }
                var resource = this.on("diff", function(sender, evt) {
                    handler.call(context, evt);
                });
                return {
                    release: function() {
                        if (resource) {
                            var data = self._data.slice();
                            if (data.length) {
                                handler.call(context, {
                                    diffs: Array(["splice", 0, data.length, []]),
                                    drops: [data],
                                    joins: Array([])
                                });
                            }
                            resource.release();
                        }
                    }
                };
            },
            /**
             * Apply a diff watcher, which handles each item in the list, to the list.
             *
             * @method monitorContaining
             * @param handler lambda(item) returning a release method
             * @return releaser A Object with release method.
             */
            monitorContaining: function(handler, context) {
                var counter = this._counting_map;
                var resources = new nx.Map();
                var retain = function(value, resource) {
                    // accept release function or direct resource as releaser
                    if (typeof resource === "function") {
                        resource = {
                            release: resource
                        };
                    }
                    // remember the releaser
                    if (resource && typeof resource.release === "function") {
                        resources.set(value, resource);
                    }
                };
                // increase counting listener
                var res_counting = this._counting_register();
                // watch the further change of the list
                var listener = this.on("counting", function(sender, change) {
                    nx.each(change, function(item) {
                        var release, resource = resources.get(item.value);
                        if (resource) {
                            if (item.count <= 0) {
                                resource.release();
                                resources.remove(item.value);
                            }
                        } else {
                            if (item.count > 0) {
                                release = handler.call(context, item.value);
                                retain(item.value, release);
                            }
                        }
                    });
                }, this);
                // and don't forget the existing items in the list
                nx.each(this._data, function(item) {
                    var resource = handler.call(context, item);
                    retain(item, resource);
                }, this);
                // return unwatcher
                return {
                    release: function() {
                        if (listener) {
                            // clear resources
                            resources.each(function(resource, value) {
                                resource.release();
                            });
                            resources.clear();
                            // clear listener
                            listener.release();
                            listener = null;
                        }
                        if (res_counting) {
                            res_counting.release();
                            res_counting = null;
                        }
                    }
                };
            },
            /**
             * Apply a diff watcher, which handles each item in the list, to the list.
             *
             * @method monitorCounting
             * @param handler lambda(item) returning a release method
             * @return releaser A Object with release method.
             */
            monitorCounting: function(handler, context) {
                var counter = this._counting_map;
                var resources = new nx.Map();
                // increase counting listener
                var res_counting = this._counting_register();
                // watch the further change of the list
                var listener = this.on("counting", function(sender, change) {
                    nx.each(change, function(item) {
                        var resource = resources.get(item.value);
                        if (resource) {
                            resource(item.count);
                            if (item.count <= 0) {
                                resources.remove(item.value);
                            }
                        } else if (item.count > 0) {
                            resource = handler.call(context, item.value, item.count);
                            if (resource) {
                                resources.set(item.value, resource);
                            }
                        }
                    });
                }, this);
                // and don't forget the existing items in the list
                nx.each(counter, function(count, value) {
                    var resource = handler.call(context, value, count);
                    if (resource) {
                        resources.set(value, resource);
                    }
                }, this);
                // return unwatcher
                return {
                    release: function() {
                        if (listener) {
                            // clear resources
                            resources.each(function(resource, value) {
                                resource(0);
                            });
                            resources.clear();
                            // clear listener
                            listener.release();
                            listener = null;
                        }
                        if (res_counting) {
                            res_counting.release();
                            res_counting = null;
                        }
                    }
                };
            }
        },
        statics: {
            /**
             * This util returns a monitor function of ObservableList, which is used to synchronize item existance between 2 lists.
             *
             * @method getListSyncMonitor
             * @param list The target list to be synchronized.
             * @param sync
             *  <ul>
             *  <li>If true, make sure target list will have all items as source list has;</li>
             *  <li>If false, make sure target list will not have any item as source list has.</li>
             *  </ul>
             *  Default true.
             * @return {function&lt;item&gt;}
             *  The monitor function.
             */
            getListSyncMonitor: function(coll, sync) {
                if (sync !== false) {
                    return function(item) {
                        coll.push(item);
                        return function() {
                            coll.remove(item);
                        };
                    };
                } else {
                    return function(item) {
                        coll.remove(item);
                        return function() {
                            coll.push(item);
                        };
                    };
                }
            },
            /**
             * Build a tree of expresson syntax with the expression tokens.
             * e.g. tokens ["A", "|", "B", "&", "(", "C", "&", "D", ")"], which was separated from expression "A | B & (C | D)",
             * will be separated into [|, A, [&, B, [|, C, D]]], because '&' has higher priority than '|',
             * and braced "C | D" has higher priority than &. <br/>
             * <br/>
             * Similar to the priorities in JavaScript:<br/>
             * <table>
             * <tr><th>operator</th><th>functionality</th></tr>
             * <tr><td>()</td><td>braces</td></tr>
             * <tr><td>-</td><td>complement</td></tr>
             * <tr><td>&</td><td>cross</td></tr>
             * <tr><td>^</td><td>symmetric difference</td></tr>
             * <tr><td>|</td><td>union</td></tr>
             * <tr><td>&&</td><td>and (the first empty list or the last list)</td></tr>
             * <tr><td>||</td><td>or (the first non-empty list)</td></tr>
             * </table>
             *
             * @method buildExpressionTree
             * @param {Array of token} tokens
             * @return {Array tree} Parsed syntax tree of the expression tokens.
             * @static
             */
            buildExpressionTree: (function() {
                var PRIORITIES = [
                    ["-"],
                    ["&"],
                    ["^"],
                    ["|"],
                    ["&&"],
                    ["||"]
                ];
                var getPriority = function(opr) {
                    for (var i = 0; i < PRIORITIES.length; i++) {
                        if (PRIORITIES[i].indexOf(opr) >= 0) {
                            return i;
                        }
                    }
                };
                var buildExpressionNode = function(opr, opn1, opn2) {
                    if (Object.prototype.toString.call(opn1) === "[object Array]" && opn1[0] === opr) {
                        opn1.push(opn2);
                        return opn1;
                    }
                    return [opr, opn1, opn2];
                };
                return function(tokens) {
                    if (typeof tokens === "string") {
                        tokens = tokens.match(REGEXP_TOKENS);
                    }
                    tokens = tokens.concat([")"]);
                    var token, opr, oprstack = [];
                    var opn, opnstack = [];
                    var operands = [];
                    while (tokens.length) {
                        token = tokens.shift();
                        if (token === ")") {
                            while ((opr = oprstack.pop())) {
                                if (opr === "(") {
                                    break;
                                }
                                opn = opnstack.pop();
                                opnstack.push(buildExpressionNode(opr, opnstack.pop(), opn));
                            }
                        } else if (token === "(") {
                            oprstack.push(token);
                        } else if (token.match(REGEXP_OPN)) {
                            opnstack.push(token);
                            if (operands.indexOf(token) == -1) {
                                operands.push(token);
                            }
                        } else if (token.match(REGEXP_OPR)) {
                            while (oprstack.length) {
                                opr = oprstack.pop();
                                if (opr === "(" || getPriority(opr) > getPriority(token)) {
                                    oprstack.push(opr);
                                    break;
                                }
                                opn = opnstack.pop();
                                opnstack.push(buildExpressionNode(opr, opnstack.pop(), opn));
                            }
                            oprstack.push(token);
                        }
                    }
                    if (opnstack[0]) {
                        opnstack[0].operands = operands;
                    }
                    return opnstack[0];
                };
            })(),
            /**
             * Apply a inter-list releation to a list.
             * Supported operators:<br/>
             * <table>
             * <tr><th>Operator</th><th>Calculation</th><th>Method</th></tr>
             * <tr><td>&amp;</td><td>Sets cross</td><td>cross</td></tr>
             * <tr><td>|</td><td>Sets union</td><td>union</td></tr>
             * <tr><td>^</td><td>Sets symmetric difference</td><td>delta</td></tr>
             * <tr><td>-</td><td>Sets complement</td><td>complement</td></tr>
             * <tr><td>&amp;&amp;</td><td>Sets logical and</td><td>and</td></tr>
             * <tr><td>||</td><td>Sets logical or</td><td>or</td></tr>
             * </table>
             * Tips:
             * <ul>
             * <li>Logical and means 'first empty list or last list'</li>
             * <li>Logical or means 'first non-empty list or last list'</li>
             * </ul>
             *
             * @method calculate
             * @param target {nx.List} The target list.
             * @param expression {String} The relation expression.
             * @param map {nx.Map} The relation expression.
             * @return An object with release method.
             */
            calculate: function(expression, map) {
                // TODO more validation on the expression
                if (!expression.match(REGEXP_CHECK)) {
                    throw new Error("Bad expression.");
                }
                // initialize map with normal object
                if (!nx.is(map, nx.Map)) {
                    map = new nx.Map(map);
                }
                var tokens = expression.match(REGEXP_TOKENS);
                var requirements = tokens.filter(RegExp.prototype.test.bind(REGEXP_OPN));
                var tree = EXPORT.buildExpressionTree(tokens);
                // sync with the list existence
                var target = new nx.List();
                var reqmgr = {
                    count: 0,
                    map: {},
                    sync: function() {
                        if (reqmgr.count === requirements.length) {
                            var coll;
                            if (typeof tree === "string") {
                                // need not to calculate
                                coll = map.get(tree);
                            } else {
                                target.retain(coll);
                                coll = EXPORT.calculateTree(tree, map);
                            }
                            target.retain(coll.monitorContaining(EXPORT.getListSyncMonitor(target)));
                        }
                    },
                    monitor: function(key, value) {
                        if (requirements.indexOf(key) >= 0) {
                            reqmgr.count += ((!reqmgr.map[key]) * 1 + (!!value) * 1 - 1);
                            reqmgr.map[key] = value;
                            reqmgr.sync();
                        }
                    }
                };
                target.retain(map.monitor(reqmgr.monitor));
                return target;
            },
            calculateTree: function(tree, map) {
                var target, iterate, opr = tree[0];
                // short-circuit for logical operatiors (&& and ||)
                switch (opr) {
                    case "&&":
                        target = new nx.List();
                        iterate = function(idx) {
                            var coll, resource;
                            if (typeof tree[idx] === "string") {
                                coll = map.get(tree[idx]);
                                resource = new nx.Object();
                            } else {
                                resource = coll = EXPORT.calculateTree(tree[idx], map);
                            }
                            if (idx >= tree.length - 1) {
                                resource.retain(coll.monitorContaining(EXPORT.getListSyncMonitor(target)));
                            } else {
                                resource.retain(coll.watch("length", function(n, v) {
                                    if (v) {
                                        return iterate(idx + 1);
                                    }
                                }));
                            }
                            return resource;
                        };
                        target.retain(iterate(1));
                        break;
                    case "||":
                        target = new nx.List();
                        iterate = function(idx) {
                            var coll, resource;
                            if (typeof tree[idx] === "string") {
                                coll = map.get(tree[idx]);
                                resource = new nx.Object();
                            } else {
                                resource = coll = EXPORT.calculateTree(tree[idx], map);
                            }
                            if (idx >= tree.length - 1) {
                                resource.retain(coll.monitorContaining(EXPORT.getListSyncMonitor(target)));
                            } else {
                                resource.retain(coll.watch("length", function(n, v) {
                                    if (!v) {
                                        return iterate(idx + 1);
                                    } else {
                                        return coll.monitorContaining(EXPORT.getListSyncMonitor(target));
                                    }
                                }));
                            }
                            return resource;
                        };
                        target.retain(iterate(1));
                        break;
                    default:
                        target = (function() {
                            var target, calcs = [];
                            var i, coll, colls = [];
                            for (i = 1; i < tree.length; i++) {
                                if (typeof tree[i] === "string") {
                                    coll = map.get(tree[i]);
                                } else {
                                    coll = EXPORT.calculateTree(tree[i], map);
                                    calcs.push(coll);
                                }
                                colls.push(coll);
                            }
                            target = EXPORT[OPERATORNAMES[opr]](colls);
                            nx.each(calcs, function(calc) {
                                target.retain(calc);
                            });
                            return target;
                        })();
                        break;
                }
                return target;
            },
            /**
             * Select a sub-list from a source list.
             * Usage:
             * <pre>
             * // select all items from list with property active==true
             * resource = subList.select(list, "active")
             * // select all items from list with path owner.name=="Knly"
             * resource = subList.select(list, "owner.name", function(name){
             *     return name==="Knly";
             * });
             * // select all string item from list
             * resource = subList.select(list, function(item){
             *     return typeof item === "string";
             * });
             * </pre>
             * 
             * @method select
             * @param {nx.List} source
             * @param {String} conditions (Optional)
             * @param {Function} determinator
             * @return resource for release the binding
             * @static
             */
            select: function(source, conditions, determinator) {
                if (!nx.is(source, EXPORT)) {
                    // TODO select from array
                    return null;
                }
                // FIXME keep the order of items as it was in source
                if (typeof conditions === "function") {
                    determinator = conditions;
                    conditions = null;
                }
                if (!determinator) {
                    determinator = nx.identity;
                }
                var target = new EXPORT();
                target.retain(source.monitorContaining(function(item) {
                    var resource;
                    if (conditions) {
                        if (nx.is(item, nx.Object)) {
                            // monitor the specified conditions
                            resource = nx.Object.cascade(item, conditions, function() {
                                target.toggle(item, determinator.apply(target, arguments));
                            });
                        } else {
                            // determine the specified conditions if unable to monitor
                            target.toggle(item, determinator.call(target, nx.path(item, conditions)));
                        }
                    } else {
                        // no condition specified means determine item itself
                        target.toggle(item, determinator.call(target, item));
                    }
                    return function() {
                        resource && resource.release();
                        target.toggle(item, false);
                    };
                }));
                return target;
            },
            /**
             * Summarize all values of a list and return to a callback function.
             *
             * @method summarize
             * @param {nx.List} source
             * @param {Function} callback
             * @return resource for release the binding
             * @static
             */
            summarize: function(source, callback) {
                sum = 0;
                return source.monitorDiff(function(evt) {
                    nx.each(evt.diffs, function(diff, idx) {
                        var vdrop = evt.drops[idx];
                        var vjoin = evt.joins[idx];
                        var delta = nx.math.plus.apply(this, vjoin) - nx.math.plus.apply(this, vdrop);
                        if (delta) {
                            sum = sum + delta;
                        }
                    });
                    callback(sum);
                });
            },
            sorting: function(list, comparator) {
                // TODO
            },
            /**
             * Affect target to be the cross list of sources lists.
             * Release object could stop the dependencies.
             *
             * @method cross
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            cross: function(sources) {
                var target = new nx.List();
                var counter = new nx.Counter();
                if (nx.is(sources, Array)) {
                    sources = new nx.List(sources);
                }
                target.retain(counter.on("increase", function(o, evt) {
                    if (evt.count == sources.length()) {
                        target.push(evt.item);
                    }
                }));
                target.retain(counter.on("decrease", function(o, evt) {
                    if (evt.count == sources.length() - 1) {
                        target.remove(evt.item);
                    }
                }));
                target.retain(sources.monitorContaining(function(source) {
                    return source.monitorContaining(function(item) {
                        counter.increase(item, 1);
                        return function() {
                            counter.decrease(item, 1);
                        };
                    });
                }));
                return target;
            },
            /**
             * Affect target to be the union list of sources lists.
             * Release object could stop the dependencies.
             *
             * @method union
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            union: function(sources) {
                var target = new nx.List();
                var counter = new nx.Counter();
                if (nx.is(sources, Array)) {
                    sources = new nx.List(sources);
                }
                target.retain(counter.on("increase", function(o, evt) {
                    if (evt.count === 1) {
                        target.push(evt.item);
                    }
                }));
                target.retain(counter.on("decrease", function(o, evt) {
                    if (evt.count === 0) {
                        target.remove(evt.item);
                    }
                }));
                target.retain(sources.monitorContaining(function(source) {
                    return source && source.monitorContaining(function(item) {
                        counter.increase(item, 1);
                        return function() {
                            counter.decrease(item, 1);
                        };
                    });
                }));
                return target;
            },
            /**
             * Affect target to be the complement list of sources lists.
             * Release object could stop the dependencies.
             *
             * @method complement
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            complement: function(sources) {
                var target = new nx.List();
                var counter = new nx.Counter();
                var length = sources.length;
                target.retain(counter.on("count", function(o, evt) {
                    var previous = evt.previousCount,
                        count = evt.count;
                    if (previous < length && count >= length) {
                        target.push(evt.item);
                    }
                    if (previous >= length && count < length) {
                        target.remove(evt.item);
                    }
                }));
                target.retain(sources[0].monitorContaining(function(item) {
                    counter.increase(item, length);
                    return function() {
                        counter.decrease(item, length);
                    };
                }));
                nx.each(sources, function(coll, index) {
                    if (index > 0) {
                        target.retain(coll.monitorContaining(function(item) {
                            counter.decrease(item);
                            return function() {
                                counter.increase(item);
                            };
                        }));
                    }
                });
                return target;
            },
            /**
             * Affect target to be the symmetric difference list of sources lists.
             * Release object could stop the dependencies.
             * The name 'delta' is the symbol of this calculation in mathematics.
             * @reference {http://en.wikipedia.org/wiki/Symmetric_difference}
             * @method delta
             * @param target {List}
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            delta: function(sources) {
                var target = new nx.List();
                nx.each(sources, function(coll) {
                    target.retain(coll.monitorContaining(function(item) {
                        target.toggle(item);
                        return function() {
                            if (!target.__released__) {
                                target.toggle(item);
                            }
                        };
                    }));
                });
                return target;
            },
            /**
             * Affect target to be the equivalent list of the first empty list or the last list.
             * Release object could stop the dependencies.
             *
             * @method and
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            and: function(sources) {
                var target = new nx.List();
                var iterate = function(idx) {
                    var watcher, resource, coll = sources[idx];
                    if (idx === sources.length - 1) {
                        return coll.monitorContaining(function(item) {
                            target.push(item);
                            return function() {
                                if (!target.__released__) {
                                    target.remove(item);
                                }
                            };
                        });
                    }
                    return coll.watch("length", function(n, v) {
                        if (v) {
                            return iterate(idx + 1);
                        }
                    });
                };
                target.retain(iterate(0));
                return target;
            },
            /**
             * Affect target to be the equivalent list of the first non-empty list.
             * Release object could stop the dependencies.
             *
             * @method or
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            or: function(sources) {
                var target = new nx.List();
                var iterate = function(index) {
                    var coll = sources[index];
                    return coll.watch("length", function(name, value) {
                        if (index < sources.length - 1 && !value) {
                            return iterate(index + 1);
                        } else {
                            return coll.monitorContaining(function(item) {
                                target.push(item);
                                return function() {
                                    if (!target.__released__) {
                                        target.remove(item);
                                    }
                                };
                            });
                        }
                    });
                };
                target.retain(iterate(0));
                return target;
            }
        }
    });

})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    /**
     * Slice a sublist of a list, and the slice segment will be kept.
     * 
     * @method slicing
     * @param {nx.List} source The source list.
     * @param {Integer} offset Index from.
     * @param {Integer} end Index end.
     * @return The sublist.
     * @static
     */
    nx.path(global, "nx.List.slicing", function(source, offset, end) {
        var target = new nx.List();
        target.retain(source.monitorDiff(function(evt) {
            var affect = false;
            nx.each(evt.diffs, function(diff, idx) {
                switch (diff[0]) {
                    case "splice":
                        if (diff[1] < end) {
                            if (diff[1] + diff[2] >= offset) {
                                affect = true;
                                return false;
                            }
                            if (diff[3].length !== diff[2]) {
                                affect = true;
                                return false;
                            }
                        }
                        break;
                    case "move":
                        if (diff[1] <= offset && diff[1] + diff[2] + diff[3] >= end) {
                            affect = true;
                            return false;
                        }
                        break;
                }
            });
            if (affect) {
                target.spliceAll(0, end - offset, source.data().slice(offset, end));
            }
        }));
        return target;
    });
})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    /**
     * Mapping a list to another list with a mapper.
     * 
     * @method mapping
     * @param {nx.List} source
     * @param {String} paths Optional.
     * @param {Boolean} async Optional.
     * @param {Function} handler Optional.
     * @return resource for release the mapping
     * @static
     */
    nx.path(global, "nx.List.mapping", function(source, paths, async, handler) {
        var binding = nx.binding(paths, async, handler);
        // create the target
        var target = new nx.List();
        // prepare lengths and starts
        var internal = {
            listeners: [],
            shift: function(index, delta) {
                var i;
                for (i = index; i < internal.listeners.length; i++) {
                    internal.listeners[i].index += delta;
                }
            },
            listen: function(item, index) {
                var listener, resource;
                listener = {
                    index: index,
                    set: function(value) {
                        if (hasown.call(listener, "value")) {
                            target.splice(listener.index, 1, value);
                        }
                        listener.value = value;
                    },
                    release: function() {
                        resource && resource.release();
                        resource = null;
                    }
                };
                if (binding.paths && binding.paths.length) {
                    resource = nx.Object.binding(item, binding, function(value) {
                        listener.set(value);
                    });
                } else if (!binding.async) {
                    listener.set(binding.handler(item));
                } else {
                    resource = binding.handler({
                        get: function() {
                            return listener.value;
                        },
                        set: listener.set
                    }, item);
                }
                return listener;
            },
            release: function() {
                nx.each(internal.listeners, function(listener) {
                    listener.release();
                });
            },
            move: function(i, n, d) {
                var p, listener, listeners = internal.listeners;
                var movements = [
                    [i, n, d],
                    d > 0 ? [i + n, d, -n] : [i + d, -d, n]
                ];
                // shift both parts
                nx.each(movements, function(movement) {
                    for (p = 0; p < movement[1]; p++) {
                        listener = listeners[movement[0] + p];
                        listener.index += movement[2];
                    }
                });
                nx.func.apply(splice, internal.listeners, i + d, 0, internal.listeners.splice(i, n));
            }
        };
        // initialize all listeners
        source.each(function(item, idx) {
            var listener = internal.listen(item, idx);
            target.push(listener.value);
            internal.listeners.push(listener);
        });
        // sync listeners and sources
        target.retain(internal);
        target.retain(source.on("diff", function(sender, evt) {
            var diffs = [];
            nx.each(evt.diffs, function(diff, idx) {
                var drop, join, pos, additions, listeners;
                switch (diff[0]) {
                    case "splice":
                        pos = diff[1], drop = evt.drops[idx], join = evt.joins[idx];
                        // listeners
                        listeners = join.map(function(source, idx) {
                            return internal.listen(source, pos + idx);
                        });
                        additions = listeners.map(function(listener) {
                            return listener.value;
                        });
                        // sync listeners, release removed ones
                        internal.shift(pos + drop.length, join.length - drop.length);
                        drop = nx.func.apply(splice, internal.listeners, pos, drop.length, listeners);
                        // release droped
                        nx.each(drop, function(listener) {
                            listener.release();
                        });
                        // add diffs
                        diffs.push(["splice", pos, drop.length, additions]);
                        break;
                    case "move":
                        internal.move(diff[1], diff[2], diff[3]);
                        diffs.push(diff.slice());
                        break;
                }
            });
            diffs.length && target.differ(diffs);
        }));
        return target;
    });
})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    var positive = function(v) {
        return Math.max(v, 0);
    };
    var floor = Math.floor;
    var ceil = Math.ceil;
    /**
     * @param source The source list.
     * @param size The size of each tuple.
     * @param step Optional. The step for separating. step=true/false/0 for loop; default step=1.
     * @param keys Optional. The keys of depending values in each tuple. Available keys are: total, index, items. Default: "items".
     * @param handler Optional. The handler on depending values changed. Schema: function(resources, deps...){}. Default: function(a,b){return b;}.
     * @return Target list of tuple results.
     */
    nx.path(global, "nx.List.tuple", function(source, size, step, keys, handler) {
        // variable arguments
        if (step * 1 >= 0) {
            step = step * 1;
        } else {
            handler = keys;
            keys = step;
            step = 1;
        }
        if (typeof keys === "string") {
            keys = keys.replace(/\s/g, "").split(",");
        }
        if (!nx.is(keys, Array)) {
            handler = keys;
            keys = ["items"];
        }
        if (typeof handler !== "function") {
            handler = function(a, b) {
                return b;
            };
        }
        var Tuple, binding;
        binding = nx.binding(keys, function() {
            var resources = this.retain("update");
            if (!resources.retain()) {
                resources = this.retain("update", new nx.Object());
            }
            return nx.func.apply(this, resources, arguments);
        });
        Tuple = nx.define({
            properties: {
                total: 0,
                index: -1,
                items: null,
                value: null
            }
        });
        var internal = {
            insensitive: keys.length === 1 && keys[0] === "items",
            items: [],
            tuples: new nx.List(),
            shift: function(offset, key, delta) {
                if (!internal.locked) {
                    var i, resource, sum;
                    for (i = offset; i < internal.resources.length; i++) {
                        resource = internal.resources[i];
                        sum = resource["_" + key + "$sum"];
                        resource[key + "$sum"].call(resource, sum + delta);
                    }
                }
            },
            splice: function(offset, ndrop, join) {
                var items = internal.items;
                var tjoin, tdrop, tuples = internal.tuples;
                var delta, q, p, Nq, Np, Mq, Mp, D, X, P;
                q = offset + ndrop, p = offset + join.length, delta = p - q;
                Nq = items.length, Np = items.length + p - q;
                Mq = positive(floor((Nq - size + step) / step)), Mp = positive(floor((Np - size + step) / step)), D = Mp - Mq;
                X = positive(floor((offset - size + step) / step));
                P = ceil(p / step);
                // update tuples count
                if (D > 0) {
                    tjoin = Array(D).join(",").split(",").map(function() {
                        // cannot use Array(D).map because of JavaScript Language defect
                        return new Tuple();
                    });
                    tuples.spliceAll(X, 0, tjoin);
                } else if (D < 0) {
                    tdrop = tuples.splice(X, -D);
                    tdrop.map(function(drop) {
                        drop.release();
                    });
                }
                // update items cache
                nx.func.apply(items.splice, items, offset, ndrop, join);
                // update tuples
                var i, tuple, index, args;
                for (i = X; i < Mp; i++) {
                    index = i * step;
                    tuple = tuples.get(i);
                    if (internal.insensitive && i >= P && delta % step === 0) {
                        // optimize for index insensitive case
                        if (tuple.index() !== index) {
                            tuple.index(index);
                            for (i++; i < Mp; i++) {
                                tuples.get(i).index(i * step);
                            }
                        }
                        break;
                    }
                    // normally update
                    tuple.total(items.length);
                    tuple.index(index);
                    tuple.items(items.slice(index, index + size));
                    args = keys.map(function(key) {
                        return nx.path(tuple, key);
                    });
                    resources = tuple.retain("update");
                    if (!resources || !resources.retain()) {
                        // none or released
                        resources = tuple.retain("update", new nx.Object());
                    }
                    args.unshift(resources);
                    tuple.value(handler.apply(source, args));
                }
            },
            move: function(offset, count, delta) {
                var items = internal.items;
                var tuples = internal.tuples;
                var X, M, Y;
                X = positive(floor((offset - size + step) / step));
                M = positive(floor((items.length - size + step) / step));
                Y = Math.min(M, ceil((offset + count + delta) / step));
                // update items cache
                nx.func.apply(items.splice, items, offset, 0, items.splice(offset + count, delta));
                // update tuples
                var i, tuple, index, args;
                for (i = X; i < Y; i++) {
                    index = i * step;
                    tuple = tuples.get(i);
                    // normal update
                    tuple.items(items.slice(index, index + size));
                    args = keys.map(function(key) {
                        return nx.path(tuple, key);
                    });
                    resources = tuple.retain("update");
                    if (!resources || !resources.retain()) {
                        resources = tuple.retain("update", new nx.Object());
                    }
                    args.unshift(resources);
                    tuple.value(handler.apply(source, args));
                }
            }
        };
        internal.tuples.retain(source.monitorDiff(function(evt) {
            // diffs of target
            nx.each(evt.diffs, function(diff, idx) {
                switch (diff[0]) {
                    case "splice":
                        var offset = diff[1];
                        var drop = evt.drops[idx];
                        var join = evt.joins[idx];
                        // splice them
                        internal.splice(offset, drop.length, join);
                        break;
                    case "move":
                        internal.move(diff[1], diff[2], diff[3]);
                        break;
                }
            });
        }));
        // create the target list
        var target = nx.List.mapping(internal.tuples, "value");
        target.retain(internal.tuples);
        return target;
    });
})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    nx.path(global, "nx.List.mapeach", function(source, as, mappings) {
        // variable arguments
        if (typeof as !== "string") {
            mappings = as;
            as = "$origin";
        }
        // create the target
        var target = new nx.List();
        // preprocess mappings
        mappings = (function(mappings) {
            var has, o = {};
            nx.each(mappings, function(mapping, key) {
                var def = {};
                // get the binding object
                if (!nx.is(mapping, nx.binding)) {
                    if (nx.is(mapping, "String") || nx.is(mapping, "Function")) {
                        mapping = nx.binding(mapping);
                    } else if (nx.is(mapping, "Array")) {
                        mapping = nx.binding.apply(mapping);
                    } else if (mapping.paths || mapping.handler) {
                        mapping = nx.binding(mapping);
                    } else {
                        mapping = nx.binding((function(mapping) {
                            return function() {
                                return mapping;
                            };
                        })(mapping));
                    }
                }
                // check if set 'as'
                if (as === "$origin" && mapping.paths) {
                    mapping.paths = mapping.paths.map(function(path) {
                        return as + "." + path;
                    });
                }
                // get the intention of summarizing
                if (key.charAt(0) === "+") {
                    def.summarize = "0";
                    key = key.substring(1);
                } else if (key.charAt(key.length - 1) === "+") {
                    def.summarize = "1";
                    key = key.substring(0, key.length - 1);
                }
                // mark it
                def.binding = mapping;
                def.path = key;
                o[key.replace(/\./g, "\\$")] = def;
                has = true;
            });
            if (!has && as === "$origin") {
                throw new Error("Missing mapping definition.");
            }
            return o;
        })(mappings);
        // create internal resource manager
        var internal;
        var Item = (function() {
            var properties = {};
            // create resource properties
            properties.index = -1;
            properties[as] = null;
            nx.each(mappings, function(mapping, key) {
                var v = {};
                v.value = mapping.binding;
                properties[key + "$value"] = v;
                if (mapping.summarize) {
                    v.watcher = function(pname, pvalue, poldvalue) {
                        this._index >= 0 && internal.shift(this._index + 1, key, (pvalue || 0) - (poldvalue || 0));
                    };
                    properties[key + "$sum"] = null;
                }
            });
            if (as !== "$origin") {
                // create value properties
                nx.each(mappings, function(mapping, key) {
                    if (key.indexOf("$") === -1) {
                        properties[key] = null;
                    }
                });
            }
            return nx.define({
                properties: properties
            });
        })();
        internal = {
            values: [],
            resources: [],
            locked: false,
            create: function(source) {
                var item = new Item();
                item[as].call(item, source);
                return item;
            },
            lock: function(callback) {
                internal.locked = true;
                callback();
                internal.locked = false;
            },
            shift: function(offset, key, delta) {
                if (!internal.locked) {
                    var i, resource, sum;
                    for (i = offset; i < internal.resources.length; i++) {
                        resource = internal.resources[i];
                        sum = resource["_" + key + "$sum"];
                        resource[key + "$sum"].call(resource, sum + delta);
                    }
                }
            },
            splice: function(offset, ndrop, resources, values, dropping) {
                var vdrops = nx.func.apply(splice, internal.values, offset, ndrop, values);
                var rdrops = nx.func.apply(splice, internal.resources, offset, ndrop, resources);
                var i, shifted, deltas, resource;
                // update the index of incomings
                nx.each(resources, function(resource, idx) {
                    resource.index(offset + idx);
                });
                // get shifted and deltas
                shifted = resources.length - rdrops.length;
                deltas = {};
                nx.each(mappings, function(mapping, key) {
                    var sum, val, last;
                    var summarize = mapping.summarize;
                    if (summarize) {
                        last = internal.resources[offset - 1];
                        sum = last ? last["_" + key + "$sum"] : 0;
                        val = last ? last["_" + key + "$value"] : 0;
                    }
                    nx.each(rdrops, function(resource) {
                        if (summarize) {
                            // update deltas with drops
                            deltas[key] = deltas[key] || 0;
                            deltas[key] -= resource["_" + key + "$value"] || 0;
                        }
                    });
                    nx.each(resources, function(resource, idx) {
                        // update the summarize value
                        if (summarize) {
                            // update deltas with joins
                            deltas[key] = deltas[key] || 0;
                            deltas[key] += resource["_" + key + "$value"] || 0;
                            // update the sum/val variables
                            sum += val;
                            val = resource["_" + key + "$value"];
                            // update the sum of resource
                            resource[key + "$sum"].call(resource, sum);
                        }
                    });
                });
                // process droped resources
                dropping(rdrops);
                // initialize all mappings on each resource
                nx.each(mappings, function(mapping, key) {
                    var path = mapping.path;
                    var summarize = mapping.summarize;
                    nx.each(resources, function(resource, idx) {
                        var value = values[idx];
                        // extend value if property not exists
                        if (key.indexOf("$") === -1 && !value[key]) {
                            nx.Object.extendProperty(value, key, {});
                        }
                        // apply binding
                        var binding = (function() {
                            switch (summarize) {
                                case "0":
                                    return nx.binding(key + "$sum");
                                case "1":
                                    return nx.binding(key + "$value," + key + "$sum", function(a, b) {
                                        return a + b;
                                    });
                                default:
                                    return nx.binding(key + "$value");
                            }
                        })();
                        resource.retain(nx.Object.binding(resource, binding, function(val) {
                            nx.path(value, path, val);
                        }));
                    });
                });
                // shift resources behind
                for (i = offset + resources.length; i < internal.resources.length; i++) {
                    resource = internal.resources[i];
                    resource.index(resource.index() + shifted);
                    nx.each(deltas, function(delta, key) {
                        var sum = resource["_" + key + "$sum"];
                        resource[key + "$sum"].call(resource, sum + delta);
                    });
                }
            },
            move: function(i, n, d) {
                var deltas, movements = [
                    [i, n, d, {}],
                    d > 0 ? [i + n, d, -n, {}] : [i + d, -d, n, {}]
                ];
                // summarize all shifts
                nx.each(movements, function(movement, index) {
                    var p, resource, resources = internal.resources;
                    for (p = 0; p < movement[1]; p++) {
                        resource = resources[movement[0] + p];
                        nx.each(mappings, function(mapping, key) {
                            if (mapping.summarize) {
                                movement[3][key] = (movement[3][key] || 0) + resource["_" + key + "$value"];
                            }
                        });
                    }
                });
                // swap deltas of movements
                deltas = movements[0][3];
                movements[0][3] = movements[1][3];
                movements[1][3] = deltas;
                // do all shifts: index and all keys
                nx.each(movements, function(movement, index) {
                    var sign = mathsign(movement[2]);
                    var p, resource, resources = internal.resources;
                    for (p = 0; p < movement[1]; p++) {
                        resource = resources[movement[0] + p];
                        resource.index(resource._index + movement[2]);
                        nx.each(movement[3], function(delta, key) {
                            var sum = resource["_" + key + "$sum"];
                            resource[key + "$sum"].call(resource, sum + sign * delta);
                        });
                    }
                });
                nx.func.apply(splice, internal.resources, i + d, 0, internal.resources.splice(i, n));
            }
        };
        target.retain(source.monitorDiff(function(evt) {
            // diffs of target
            var diffs = [];
            nx.each(evt.diffs, function(diff, idx) {
                switch (diff[0]) {
                    case "splice":
                        var offset = diff[1];
                        var drop = evt.drops[idx];
                        var join = evt.joins[idx];
                        var rjoin = join.map(internal.create);
                        var vjoin = join.map(function(value, idx) {
                            return as === "$origin" ? value : rjoin[idx];
                        });
                        // splice them
                        internal.lock(function() {
                            internal.splice(offset, drop.length, rjoin, vjoin, function(rdrops) {
                                nx.each(rdrops, function(resource) {
                                    resource.release();
                                });
                            });
                        });
                        // append diff
                        if (drop.length || vjoin.length) {
                            diff && diffs.push(["splice", offset, drop.length, vjoin]);
                        }
                        break;
                    case "move":
                        internal.lock(function() {
                            internal.move(diff[1], diff[2], diff[3]);
                        });
                        diffs.push(diff.slice());
                        break;
                }
            });
            diffs.length && target.differ(diffs);
        }));
        return target;
    });
})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    /**
     * Sync a target list as several source lists' concatenate list.
     *
     * @method concatenate
     * @param async (Optional) Default false.
     * @param sources Array or list of sources.
     * @return resource for release this concatenate.
     */
    nx.path(global, "nx.List.concatenate", function(async, sources) {
        // optional arguments
        if (typeof async !== "boolean") {
            sources = async;
            async = false;
        }
        if (nx.is(sources, "Array")) {
            sources = new nx.List(sources);
        }
        // create the target
        var target = new nx.List();
        // prepare lengths and starts
        var internal = {
            diffs: [],
            resources: [],
            affect: function() {
                target.differ(internal.diffs || []);
                internal.diffs = [];
            },
            differ: function(diffs, immediate) {
                internal.diffs = internal.diffs.concat(diffs);
                if (async && !immediate) {
                    // TODO asynchronizely affect, e.g. timeout-zero, animation-frame, etc.
                } else {
                    internal.affect();
                }
            },
            shift: function(since, shifted, delta) {
                var i;
                for (i = since; i < internal.resources.length; i++) {
                    internal.resources[i].index += shifted;
                    internal.resources[i].start += delta;
                }
            },
            create: function(source) {
                var resource = new nx.Object();
                resource.retain(source.on("diff", function(sender, evt) {
                    resource.differ(evt.diffs);
                }));
                resource.differ = function(diffs) {
                    diffs = diffs.slice();
                    var i, diff, delta = 0;
                    for (i = 0; i < diffs.length; i++) {
                        diff = diffs[i] = diffs[i].slice();
                        diff[1] += resource.start;
                        switch (diff[0]) {
                            case "splice":
                                delta -= diff[2];
                                delta += diff[3].length;
                                break;
                            case "move":
                                // fine to do nothing
                                break;
                        }
                    }
                    resource.length += delta;
                    delta && internal.shift(resource.index + 1, 0, delta);
                    internal.differ(diffs);
                };
                return resource;
            },
            splice: function(offset, ndrop, resources, values, dropping) {
                var rdrops = nx.func.apply(splice, internal.resources, offset, ndrop, resources);
                var i, shifted, drop, join, start, end;
                end = start = internal.resources[offset - 1] ? internal.resources[offset - 1].start + internal.resources[offset - 1].length : 0;
                // get shifted and delta
                shifted = resources.length - rdrops.length;
                drop = 0, join = [];
                nx.each(rdrops, function(resource) {
                    drop += resource.length;
                });
                nx.each(resources, function(resource, idx) {
                    var value = values[idx];
                    resource.index = offset + idx;
                    resource.start = end;
                    resource.length = value.length();
                    end += resource.length;
                    join = join.concat(value.data());
                });
                // process droped resources
                dropping(rdrops);
                // shift resources behind
                if (shifted || (join.length - drop)) {
                    internal.shift(offset + resources.length, shifted, join.length - drop);
                }
                // return the diff
                if (drop || join.length) {
                    return ["splice", start, drop, join];
                }
            },
            move: function(i, n, d) {
                var resources = internal.resources;
                var start = resources[i].start;
                var deltas, movements = [
                    [i, n, d, 0],
                    d > 0 ? [i + n, d, -n, 0] : [i + d, -d, n, 0]
                ];
                // summarize all shifts
                nx.each(movements, function(movement, index) {
                    var p, resource, resources = internal.resources;
                    for (p = 0; p < movement[1]; p++) {
                        resource = resources[movement[0] + p];
                        movement[3] += resource.length;
                    }
                });
                // swap deltas of movements
                deltas = movements[0][3];
                movements[0][3] = movements[1][3];
                movements[1][3] = deltas;
                // do all shifts: index and all keys
                nx.each(movements, function(movement, index) {
                    var sign = mathsign(movement[2]);
                    var p, resource, resources = internal.resources;
                    for (p = 0; p < movement[1]; p++) {
                        resource = resources[movement[0] + p];
                        resource.index += movement[2];
                        resource.start += sign * movement[3];
                    }
                });
                nx.func.apply(splice, internal.resources, i + d, 0, internal.resources.splice(i, n));
                if (movements[0][3] && movements[1][3]) {
                    return ["move", start, movements[1][3], mathsign(d) * movements[0][3]];
                }
            },
            release: function() {
                internal.affect();
                nx.each(internal.resources, function(resource) {
                    resource.release();
                });
            }
        };
        // sync listeners and sources
        target.retain(internal);
        target.retain(sources.monitorDiff(function(evt) {
            var diffs = [];
            nx.each(evt.diffs, function(diff, idx) {
                var offset, drop, join, rjoin, vjoin;
                switch (diff[0]) {
                    case "splice":
                        var offset = diff[1];
                        var drop = evt.drops[idx];
                        var join = evt.joins[idx];
                        var rjoin = join.map(internal.create);
                        // splice them
                        diff = internal.splice(offset, drop.length, rjoin, join, function(rdrops) {
                            nx.each(rdrops, function(resource) {
                                resource.release();
                            });
                        });
                        break;
                    case "move":
                        diff = internal.move(diff[1], diff[2], diff[3]);
                        break;
                }
                // append diff
                diff && diffs.push(diff);
            });
            diffs.length && internal.differ(diffs, true);
        }));
        return target;
    })
})(nx);
(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    /**
     * Make a sorted list, synchronize with the source list, keeping the order.
     * 
     * @method sorting
     * @param {nx.List} source The source list.
     * @param {Array|String} paths Optional. The sorting paths, default ["self"].
     * @param {Function} comparator Optional. The sorting comparator, default directly minus.
     * @return The sorted list.
     * @static
     */
    nx.path(global, "nx.List.sorting", function(source, paths, comparator) {
        // variable arguments
        if (typeof paths === "function") {
            comparator = paths;
            paths = null;
        }
        if (typeof paths === "string") {
            paths = paths.replace(/\s/g, "").split(",");
        }
        if (paths && nx.is(paths, Array)) {
            if (paths.length === 1 && paths[0] === "self") {
                paths = null;
            }
        } else {
            paths = null;
        }
        if (!comparator) {
            if (paths && paths.length > 1) {
                throw new Error("List.sorting with multiple paths cannot ignore comparator");
            }
            comparator = function(a, b) {
                return a - b;
            }
        }
        // create target list
        var target = new nx.List();
        var internal = {
            vectors: [],
            map: new nx.Map(),
            position: function(item, values) {
                if (!values) {
                    return nx.array.findIndex(internal.vectors, function(vector) {
                        return vector.item === item;
                    });
                }
                var i, index, vector, diff, vectors = internal.vectors;
                for (i = 0; i < vectors.length; i++) {
                    vector = vectors[i];
                    if (vector.item !== item) {
                        diff = comparator.apply(source, values.concat(vector));
                        if (diff < 0) {
                            break;
                        }
                        if (diff == 0 && index >= 0) {
                            // keep position if compare result not changed
                            break;
                        }
                    } else {
                        index = i;
                    }
                }
                return index >= 0 ? i - 1 : i;
            },
            counting: function(item, count) {
                count = count || 0;
                var i, vectors, vector, position, delta;
                vectors = internal.vectors;
                position = internal.position(item);
                vector = internal.vectors[position];
                delta = count - vector.count;
                if (delta < 0) {
                    // drop item copies from target list
                    target.splice(vector.start, -delta);
                }
                if (delta > 0) {
                    // push item copies to target list
                    target.spliceAll(vector.start, 0, nx.array.times(delta, item));
                }
                // update vector count
                vector.count = count;
                // update start points of vectors behind
                for (i = position + 1; i < vectors.length; i++) {
                    vectors[i].start += delta;
                }
                // clear vector if related item no more retained
                if (count == 0) {
                    // clear vector
                    internal.vectors.splice(position, 1);
                }
            },
            changing: function(item, values) {
                var vectors = internal.vectors;
                var orig = internal.position(item);
                var dest = internal.position(item, values);
                if (orig < 0) {
                    internal.inserting(item, values, dest);
                } else {
                    internal.moving(item, values, orig, dest);
                }
            },
            inserting: function(item, values, dest) {
                var vectors = internal.vectors;
                var vector = values.slice();
                vector.item = item;
                vector.count = 0;
                if (dest == 0) {
                    vector.start = 0;
                } else {
                    vector.start = vectors[dest - 1].start + vectors[dest - 1].count;
                }
                vectors.splice(dest, 0, vector);
            },
            moving: function(item, values, orig, dest) {
                if (orig == dest) {
                    return;
                }
                var vector, vectors;
                vectors = internal.vectors;
                vector = vectors[orig];
                var i, v, direction, delta;
                direction = mathsign(dest - orig);
                delta = 0;
                for (i = orig; i != dest; i += direction) {
                    v = vectors[i + direction];
                    delta += direction * v.count;
                    v.start -= direction * vector.count;
                }
                target.move(vector.start, vector.count, delta);
                vectors.splice(orig, 1), vectors.splice(dest, 0, vector);
                vector.start += delta;
            }
        };
        target.retain(source.monitorCounting(function(item, count) {
            var resources;
            if (paths) {
                resources = nx.Object.cascade(item, paths, function() {
                    var values = Array.prototype.slice.call(arguments, 0, paths.length);
                    internal.changing(item, values);
                });
            } else {
                internal.changing(item, [item]);
            }
            internal.counting(item, count);
            return function(c) {
                internal.counting(item, c);
                if (c == 0) {
                    resources && resources.release();
                }
            };
        }));
        return target;
    });
})(nx);
(function (nx) {
    var count = nx.array.count;
    nx.define("nx.UniqueList", nx.List, {
        methods: {
            init: function (data) {
                this.inherited(data);
                this.retain(this._counting_register());
            },
            _differ: function (diffs) {
                for (i = 0; i < diffs.length; i++) {
                    var i, value, joins, drops, diff, counting;
                    var data = this._data;
                    if (diffs.length === 1) {
                        diff = diffs[0];
                        counting = this._counting_map;
                        // check the duplication and get the actual diffs
                        switch (diff[0]) {
                        case "splice":
                            joins = diff[3];
                            drops = data.slice(diff[1], diff[1] + diff[2]);
                            // clear joins for duplication
                            for (i = joins.length; i >= 0; i--) {
                                value = joins[i];
                                if (counting.get(value) + count(joins, value) - count(drops, value) > 1) {
                                    if (joins === diff[3]) {
                                        joins = joins.slice();
                                        diffs = [
                                            ["splice", diff[1], diff[2], joins]
                                        ];
                                    }
                                    joins.splice(i, 1);
                                }
                            }
                            break;
                        }
                        // check if any diff necessary
                        if (diffs && diffs.length) {
                            return this.inherited(diffs);
                        } else {
                            return null;
                        }
                    }
                    // TODO more optimize by pre-reject insert
                    var evt = this.inherited(diffs);
                    for (i = data.length; i > 0; i--) {
                        value = data[i];
                        if (data.indexOf(value) !== i) {
                            data.splice(i, 1);
                            if (evt.diffs === diffs) {
                                evt.diffs = evt.diffs.slice();
                            }
                            evt.diffs.push(["splice", i, 1, []]);
                            evt.drops.push([value]);
                            evt.joins.push([]);
                        }
                    }
                    return evt;
                }
                return this.inherited(diffs);
            }
        }
    });
})(nx);
(function (nx) {

    nx.template = function (paths, async, handler, pattern) {
        if (!(this instanceof nx.template)) {
            // call as factory
            return new nx.template(paths, async, handler, pattern);
        }
        if (arguments.length) {
            var binding;
            // optionalize arguments
            if (paths instanceof nx.binding) {
                // (binding Binding, pattern Any)
                binding = paths;
                pattern = async;
            } else {
                if (typeof paths === "function") {
                    // (handler Function, pattern Any)
                    pattern = async;
                    handler = paths;
                    async = false;
                    paths = [];
                } else if (typeof paths === "boolean") {
                    // (async Boolean, handler Function, pattern Any)
                    pattern = handler;
                    handler = async;
                    async = paths;
                    paths = [];
                } else if (typeof async === "function") {
                    // (paths String|Array, handler Function, pattern Any)
                    pattern = handler;
                    handler = async;
                    async = false;
                } else if (typeof paths !== "string" && !nx.is(paths, "Array")) {
                    // (config Object)
                    if (nx.is(paths.source, nx.binding)) {
                        pattern = paths.pattern;
                        binding = paths.source;
                    } else {
                        pattern = paths.pattern;
                        handler = paths.handler;
                        async = !!paths.async;
                        paths = paths.paths || [];
                    }
                } else {
                    if (typeof async === "function") {
                        pattern = handler;
                        handler = async;
                        async = false;
                    } else if (typeof async !== "boolean") {
                        pattern = async;
                        handler = null;
                        async = false;
                    }
                }
                // make up binding if necessary
                if (!binding) {
                    binding = nx.binding(paths, async, handler);
                }
            }
            // create options
            this.binding = binding;
            this.pattern = nx.is(pattern, "Array") ? pattern : [pattern];
        }
    };

})(nx);
(function(nx) {
    var KEYWORDS = ["name", "events", "properties", "content", "extend"];

    var rSingleStringBinding = /^\{([^\}]*)\}$/;
    var rStringBinding = /\{([^\}]*)\}/g;
    var rBlank = /\s/g;

    var EXPORT = nx.define("nx.Hierarchical", {
        properties: {
            parent: null,
            childDefaultType: "nx.Hierarchical",
            childList: {
                set: function() {
                    throw new Error("Unable to set child list out of Hierarchical.");
                }
            },
            hierarchicalSyncParent: nx.binding("childList", function(childList) {
                var self = this;
                this.release("hierarchicalSyncParent");
                if (nx.is(childList, nx.List)) {
                    this.retain("hierarchicalSyncParent", childList.monitorDiff(function(evt) {
                        nx.each(evt.diffs, function(diff, idx) {
                            var drops = evt.drops[idx];
                            var joins = evt.joins[idx];
                            nx.each(drops, function(drop) {
                                if (nx.is(drop, EXPORT)) {
                                    drop.parent(null);
                                }
                            });
                            nx.each(joins, function(join) {
                                if (nx.is(join, EXPORT)) {
                                    join.parent(self);
                                }
                            });
                        });
                    }));
                }
            })
        },
        methods: {
            init: function() {
                this.inherited();
                // initialize the child list
                this._childList = new nx.List();
                this.notify("childList");
                // initialize the hierarchical definitions
                this.initHierarchical();
            },
            initHierarchical: function() {
                var instance = this;
                var clazz = instance.constructor;
                // get instance's hierarchies of the whole inheritance
                var hierarchical, hierarchicals = [];
                do {
                    hierarchical = clazz.__meta__.hierarchical;
                    if (hierarchical) {
                        // TODO validate structure configuration
                        hierarchicals.unshift(hierarchical);
                    }
                    clazz = clazz.__super__;
                } while (clazz && clazz !== EXPORT);
                // initialize the element in order
                nx.each(hierarchicals, function(hierarchical) {
                    instance.__hierarchical__ = instance.__hierarchical__ || {};
                    nx.each(hierarchical, function(initializer, key) {
                        if (KEYWORDS.indexOf(key) >= 0) {
                            throw new Error("Cannot use hierarchical keyword: " + key);
                        }
                        if (instance.__hierarchical__[key]) {
                            // TODO conflict on inherit path
                        }
                        instance.__hierarchical__[key] = initializer;
                    });
                });
            },
            hierarchicalUpdate: function(meta, context) {
                var self = this;
                context = context || self;
                var resources = new nx.Object();
                // extend hierarchical configurations
                nx.each(self.__hierarchical__, function(hierarchical, key) {
                    if (meta[key]) {
                        resources.retain(hierarchical.call(self, meta[key], context));
                    }
                });
                // bind event on "self" to "context"
                nx.each(meta.events, function(handler, name) {
                    resources.retain(self.hierarchicalUpdateEvent(name, handler, context));
                });
                // set properties of "self"
                nx.each(meta.properties, function(value, key) {
                    resources.retain(self.hierarchicalUpdateProperty(key, value, context));
                });
                // set content of "self" for only Hierarchical
                resources.retain(self.hierarchicalAppend(meta.content, context));
                // set property-as-child extending of "self"
                nx.each(meta.extend, function(meta, key) {
                    var target = nx.path(self, key);
                    if (target) {
                        if (meta.type) {
                            throw new Error("Cannot specify type while extending existing self: " + key);
                        }
                        resources.retain(target.hierarchicalUpdate(meta, context));
                    } else {
                        // TODO key as path
                        // create if specified path not exists
                        target = EXPORT.create(self, meta);
                        // update the target
                        EXPORT.extendProperty(self, key, target);
                        resources.retain(target.hierarchicalUpdate(meta, context));
                    }
                });
                return resources;
            },
            hierarchicalAppend: function(meta, context, list) {
                var self = this;
                var binding, template;
                if (!meta && meta !== 0) {
                    // not an available meta
                    return nx.Object.IDLE_RESOURCE;
                } else if (nx.is(meta, Array)) {
                    return self.hierarchicalAppendArray(meta, context, list);
                } else if (typeof meta === "string") {
                    // text
                    return self.hierarchicalAppendString(meta, context, list);
                } else if (typeof meta === "number") {
                    // number
                    return self.hierarchicalAppendNumber(meta, context, list);
                } else if (nx.is(meta, EXPORT)) {
                    // Hierarchical
                    return self.hierarchicalAppendChildren([meta], context, list);
                } else if (meta instanceof nx.binding) {
                    // binding
                    return self.hierarchicalAppendBinding(meta, context, list);
                } else if (!nx.is(meta, nx.Object) && meta.existence) {
                    // conditional existence
                    return self.hierarchicalAppendObjectExistence(meta, context, list);
                } else if (meta instanceof nx.template || !nx.is(meta, nx.Object) && meta.repeat) {
                    // template
                    template = EXPORT.getTemplateByObject(meta) || meta;
                    return self.hierarchicalAppendTemplate(template, context, list);
                } else {
                    // default
                    return self.hierarchicalAppendObject(meta, context, list);
                }
            },
            hierarchicalAppendObject: function(meta, context, list) {
                var self = this;
                var resources = new nx.Object();
                var child, binding;
                binding = EXPORT.getBindingIfString(meta.type);
                if (binding) {
                    meta = nx.clone(meta); // not deep clone
                    context = context || self;
                    list = EXPORT.getFlatList(self, false, list);
                    resources.retain(list);
                    // bind to the list
                    resources.retain(nx.Object.binding(context, binding, function(result) {
                        resources.release("recursive");
                        meta.type = result;
                        resources.retain("recursive", self.hierarchicalAppendObject(meta, context, list));
                    }));
                } else {
                    // meta
                    child = EXPORT.create(self, meta);
                    // set as a named child
                    if (meta.name) {
                        // TODO if binding
                        EXPORT.extendProperty(context, meta.name, child);
                    }
                    // update the child
                    if (nx.is(child, EXPORT)) {
                        child.retain(child.hierarchicalUpdate(meta, context));
                    }
                    // update resources
                    resources.retain(child);
                    resources.retain(self.hierarchicalAppendChildren([child], context, list));
                }
                return resources;
            },
            hierarchicalAppendArray: function(meta, context, list) {
                var self = this;
                var resources = new nx.Object();
                nx.each(meta, function(meta) {
                    resources.retain(self.hierarchicalAppend(meta, context, list));
                });
                return resources;
            },
            hierarchicalAppendString: function(meta, context, list) {
                var self = this;
                // check string-style-binding
                binding = EXPORT.getBindingIfString(meta);
                if (binding) {
                    // string-style-binding
                    return self.hierarchicalAppendBinding(binding, context, list);
                }
                return nx.Object.IDLE_RESOURCE;
            },
            hierarchicalAppendNumber: function(meta, context, list) {
                return nx.Object.IDLE_RESOURCE;
            },
            hierarchicalAppendChildren: function(children, context, list) {
                var self = this;
                var resources = new nx.Object();
                context = context || self;
                list = EXPORT.getFlatList(self, true, list);
                // append children to self
                list.spliceAll(list.length(), 0, children);
                resources.retain({
                    release: function() {
                        if (children) {
                            // TODO optimize
                            list.remove.apply(list, children);
                            children = null;
                        }
                    }
                });
                return resources;
            },
            hierarchicalAppendObjectExistence: function(meta, context, list) {
                var self = this;
                context = context || self;
                // bind to the list
                var resources = new nx.Object();
                var binding, resources, existence;
                binding = EXPORT.getBindingIfString(meta.existence);
                meta = nx.extend({}, meta);
                delete meta.existence;
                // check if meta.existence is not binding
                if (!binding) {
                    return EXPORT.hierarchicalAppendObject(meta, context, list);
                }
                // process conditional existence
                resources = new nx.Object();
                existence = false;
                // bind to the list
                list = EXPORT.getFlatList(self, false, list);
                resources.retain(list);
                resources.retain(nx.Object.binding(context, binding, function(result) {
                    if (!!result !== existence) {
                        resources.release("recursive");
                        if (result) {
                            resources.retain("recursive", self.hierarchicalAppend(meta, context, list));
                        }
                    }
                }));
                return resources;
            },
            hierarchicalAppendBinding: function(binding, context, list) {
                var self = this;
                context = context || self;
                // bind to the list
                var resources = new nx.Object();
                list = EXPORT.getFlatList(self, false, list);
                resources.retain(list);
                resources.retain(nx.Object.binding(context, binding, function(result) {
                    resources.release("recursive");
                    resources.retain("recursive", self.hierarchicalAppend(result, context, list));
                }));
                return resources;
            },
            hierarchicalAppendTemplate: function(template, context, list) {
                var self = this;
                context = context || self;
                var resources = new nx.Object()
                list = EXPORT.getFlatList(self, false, list);
                resources.retain(list);
                resources.retain(new nx.HierarchicalTemplate(self, list, template, context));
                return resources;
            },
            hierarchicalUpdateEvent: function(name, handler, context) {
                var self = this;
                var resources = new nx.Object();
                // preprocess handler
                if (typeof handler === "string") {
                    if (context[handler] && context[handler].__type__ === "method") {
                        handler = context[handler];
                    } else {
                        handler = EXPORT.getBindingIfString(handler, true);
                    }
                }
                // bind or listen on event
                if (handler) {
                    if (nx.is(handler, nx.binding)) {
                        resources.retain(nx.Object.binding(context, handler, function(pvalue) {
                            resources.release("recursive");
                            resources.retain("recursive", self.hierarchicalUpdateEvent(name, pvalue, context));
                        }));
                    } else if (typeof handler === "function") {
                        name = name.indexOf(" ") >= 0 ? name.split(" ") : [name];
                        nx.each(name, function(name) {
                            resources.retain(self.on(name, handler, context));
                        });
                    }
                }
                return resources;
            },
            hierarchicalUpdateProperty: function(key, value, context) {
                var self = this;
                context = context || self;
                // parse "{xxx}"
                value = EXPORT.getBindingIfString(value) || value;
                if (nx.is(value, nx.binding)) {
                    var resources = new nx.Object();
                    return nx.Object.binding(context, value, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateProperty(key, pvalue, context));
                    });
                    return resources;
                }
                return this.hierarchicalUpdatePropertyValue(key, value, context);
            },
            hierarchicalUpdatePropertyValue: function(key, value, context) {
                var self = this;
                nx.path(self, key, value);
                return nx.Object.IDLE_RESOURCE;
            }
        },
        statics: {
            extendProperty: function(owner, name, value) {
                if (owner[name]) {
                    // TODO handle name conflict
                    if (!nx.SILENT) {
                        console.warn("Property name conflict: " + name);
                    }
                }
                nx.Object.extendProperty(owner, name, {}, true);
                nx.path(owner, name, value);
            },
            create: function(parent, meta) {
                var type, child;
                // create the child with specified type
                type = (typeof meta.type === "string") ? nx.path(global, meta.type) : meta.type;
                type = (typeof type === "function") ? type : (parent && parent.childDefaultType && parent.childDefaultType());
                type = (typeof type === "string") ? nx.path(global, type) : type;
                type = type || EXPORT;
                child = new type();
                return child;
            },
            getFlatListAppendList: function(group, plain) {
                var tmp, last;
                if (plain) {
                    // prepare a plain list
                    last = new nx.List();
                    last._flat = {
                        plain: true,
                        group: group,
                        index: group.length()
                    };
                } else {
                    // prepare a non-plain list
                    last = nx.List.concatenate(tmp = new nx.List());
                    tmp._hierarchical_concatenated = last;
                    last._hierarchical_concatenate = tmp;
                    last._flat = {
                        group: group,
                        index: group.length()
                    };
                    last.retain({
                        release: function() {
                            group.remove(last);
                        }
                    });
                }
                group.push(last);
                return last;
            },
            getFlatList: function(target, plain, orig_list) {
                // get the default list
                var list, last;
                last = list = orig_list || target._childList;
                // get or create the target list
                var group, flat, tmp, create;
                if (list._flat && !list._flat.plain) {
                    group = list._hierarchical_concatenate;
                    if (!plain) {
                        last = EXPORT.getFlatListAppendList(group, false);
                    } else {
                        last = group.get(-1);
                        if (!last || last._flat && !last._flat.plain) {
                            last = EXPORT.getFlatListAppendList(group, true);
                        }
                    }
                } else {
                    if (!plain) {
                        // check if replacement necessary
                        if (list === target._childList) {
                            // prepare a non-plain list to replace plain list
                            group = new nx.List([list]);
                            flat = nx.List.concatenate(group);
                            group._hierarchical_concatenated = flat;
                            flat._hierarchical_concatenate = group;
                            flat._flat = list._flat || {};
                            delete flat._flat.plain;
                            // replace list by flat and notify the child list change
                            target._childList = flat;
                            target.notify("childList");
                            // update the old list
                            list._flat = {
                                plain: true,
                                group: group,
                                index: 0
                            };
                        } else {
                            // use the owner group
                            group = list._flat.group;
                        }
                        // prepare the new list
                        last = EXPORT.getFlatListAppendList(group, false);
                    } else if (list !== target._childList) {
                        // get the owner group
                        group = list._flat.group;
                        last = group.get(-1);
                        if (!last || last._flat && !last._flat.plain) {
                            last = EXPORT.getFlatListAppendList(group, true);
                        }
                    }
                }
                return last;
            },
            getStringBindingByString: function(base) {
                if (base.indexOf("{") >= 0) {
                    if (rSingleStringBinding.test(base)) {
                        return nx.binding(base.substring(1, base.length - 1));
                    }
                    var keys = [];
                    var replacements = {};
                    base.replace(rStringBinding, function(match, key, index) {
                        key = key.replace(rBlank, "");
                        if (key) {
                            if (keys.indexOf(key) === -1) {
                                keys.push(key);
                            }
                            var replacement = replacements[key] = replacements[key] || [];
                            if (replacement.indexOf(match) === -1) {
                                replacement.push(match);
                            }
                        }
                        return "";
                    });
                    // create binding if has key
                    if (keys.length) {
                        return nx.binding(keys, function() {
                            var args = arguments;
                            var result = base;
                            nx.each(keys, function(key, idx) {
                                var value = args[idx];
                                if (typeof value !== "string") {
                                    if (typeof value === "number") {
                                        value = "" + value;
                                    } else if (!value) {
                                        // false/null/undefined/NaN/...
                                        value = "false";
                                    } else if (nx.is(value, nx.Object)) {
                                        value = value.__id__;
                                    } else {
                                        value = "true";
                                    }
                                }
                                nx.each(replacements[key], function(r) {
                                    result = result.replace(r, value);
                                });
                            });
                            return result;
                        });
                    }
                }
                // has not a binding
                return null;
            },
            getBindingIfString: function(value, force) {
                if (nx.is(value, nx.binding)) {
                    return value;
                }
                var binding, path;
                binding = path = null;
                // since model is not a pass-through property any further, {path.from.self} would be more useful
                if (value && typeof value === "string") {
                    // FIXME parse the expression
                    if (value.charAt(0) === "{" && value.charAt(value.length - 1) === "}") {
                        path = value.substring(1, value.length - 1);
                    } else if (force) {
                        path = value;
                    }
                }
                return binding || path && nx.binding(path);
            },
            getTemplateByObject: function(config) {
                if (!config || nx.is(config, nx.template)) {
                    return config;
                }
                var binding, value = config.repeat;
                if (nx.is(value, nx.binding)) {
                    binding = value;
                } else if (nx.is(value, Array)) {
                    binding = nx.binding(function() {
                        return value;
                    });
                } else if (value && typeof value === "string") {
                    if (value.charAt(0) === "{" && value.charAt(value.length - 1) === "}") {
                        value = value.substring(1, value.length - 1);
                    }
                    binding = nx.binding(value);
                }
                config = nx.extend({}, config);
                delete config.repeat;
                return binding && nx.template(binding, config);
            }
        }
    });
})(nx);

flattree = function(list) {
    treeof = function(list) {
        var tree = [list.__id__];
        nx.each(list._hierarchical_concatenate, function(subtree) {
            tree.push(treeof(subtree));
        });
        return tree;
    };
    var t = treeof(list);
    var line = [];
    while (list && list._flat && list._flat.group && list._flat.group._hierarchical_concatenated) {
        line.unshift(list._flat.group._hierarchical_concatenated.__id__);
        list = list._flat.group._hierarchical_concatenated;
    }
    return [line.join(">") + ">", JSON.stringify(t)]
};
(function (nx) {

    var Hierarchical = nx.Hierarchical;

    var EXPORT = nx.define("nx.HierarchicalTemplate", {
        properties: {
            parent: {},
            list: {},
            template: {},
            context: {}
        },
        methods: {
            init: function (parent, list, template, context) {
                this.inherited();
                this.parent(parent);
                this.list(list);
                this.template(template);
                this.context(context);
                this.retain(nx.Object.cascade(this, "parent,list,template,context", function (parent, list, template, context) {
                    if (list) {
                        this.release("target-list");
                        this.retain("target-list", list.monitorContaining(function (item) {
                            return function () {
                                item.release();
                            };
                        }));
                    }
                    if (parent && list && template) {
                        context = context || parent;
                        this.retain("initial", this.applyBinding(parent, list, template.binding, template.pattern, context));
                    }
                }));
            },
            applyBinding: function (parent, list, binding, pattern, context) {
                var self = this;
                var resource = new nx.Object();
                resource.retain(nx.Object.binding(context, binding, function (pvalue) {
                    resource.release("recursive");
                    if (nx.is(pvalue, nx.binding)) {
                        resource.retain("recursive", self.applyBinding(parent, list, binding, pattern, context));
                    } else if (nx.is(pvalue, nx.List)) {
                        resource.retain("recursive", self.applyList(parent, list, pvalue, pattern, context));
                    } else if (nx.is(pvalue, "Array")) {
                        resource.retain("recursive", self.applyList(parent, list, new nx.List(pvalue), pattern, context));
                    }
                }));
                return resource;
            },
            applyList: function (parent, list, source, pattern, context) {
                context = context || parent;
                var self = this;
                var scopes = nx.List.mapeach(source, "model", {
                    count: "list.length",
                    parent: function () {
                        return parent;
                    },
                    list: function () {
                        return source;
                    },
                    context: function () {
                        return context;
                    },
                    views: nx.binding("parent, context, list, model", function (parent, context, list, model) {
                        if (parent && context && list) {
                            var self = this;
                            this.release("views");
                            var resources = new nx.Object();
                            this.retain("views", resources);
                            return pattern.map(function (meta) {
                                var view = Hierarchical.create(parent, meta);
                                Hierarchical.extendProperty(view, "scope", self);
                                view.retain(view.hierarchicalUpdate(meta, view));
                                resources.retain(view);
                                return view;
                            });
                        }
                    })
                });
                scopes.retain(scopes.monitorDiff(function (evt) {
                    // TODO handle model movings
                    var tdiffs = [];
                    nx.each(evt.diffs, function (sdiff) {
                        var tdiff = sdiff.slice();
                        switch (tdiff[0]) {
                        case "splice":
                            tdiff[1] *= pattern.length;
                            tdiff[2] *= pattern.length;
                            tdiff[3] = tdiff[3].reduce(function (result, scope) {
                                return result.concat(scope.views());
                            }, []);
                            break;
                        case "move":
                            tdiff[1] *= pattern.length;
                            tdiff[2] *= pattern.length;
                            tdiff[3] *= pattern.length;
                        }
                        tdiffs.push(tdiff);
                    });
                    list.differ(tdiffs);
                }));
                return scopes;
            }
        }
    });
})(nx);
/// require base, lang, core
(function (nx) {
    /**
     * @class Math
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Math", {
        statics: (function () {
            function precised(f) {
                return function (param) {
                    var v = f(param);
                    return EXPORT.approximate(v, 0) ? 0 : v;
                }
            }
            return {
                approximate: function (a, b, precision) {
                    precision = precision || 1e-10;
                    var v = a - b;
                    return v < precision && v > -precision;
                },
                square: function (v) {
                    return v * v;
                },
                sin: precised(Math.sin),
                cos: precised(Math.cos),
                tan: precised(Math.tan),
                cot: function (a) {
                    var tan = Math.tan(a);
                    if (tan > 1e10 || tan < -1e10) {
                        return 0;
                    }
                    return 1 / tan;
                }
            };
        })()
    });
})(nx);
(function (nx) {
    /**
     * @class Rectangle
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Rectangle", {
        statics: {
            getBound: function (pos, size) {
                if (nx.is(pos, "Array")) {
                    pos = {
                        x: pos[0],
                        y: pos[1]
                    };
                }
                if (nx.is(size, "Array")) {
                    size = {
                        width: size[0],
                        height: size[1]
                    };
                }
                var x = size.width > 0 ? pos.x : pos.x - size.width;
                var y = size.height > 0 ? pos.y : pos.y - size.height;
                return {
                    x: x,
                    y: y,
                    left: x,
                    top: y,
                    width: Math.abs(size.width),
                    height: Math.abs(size.height)
                };
            },
            isInside: function (pos, bound) {
                return pos.x >= bound.x && pos.y >= bound.y && pos.x <= bound.x + bound.width && pos.y <= bound.y + bound.height;
            },
            calcCentralizeMatrix: function (matrix, stageSize, rect, padding, rectAccordMatrix) {
                if (!(stageSize.width > 0) ||
                    !(stageSize.height > 0) ||
                    !Math.abs(rect.width) ||
                    !Math.abs(rect.height)) {
                    return nx.geometry.Matrix.I;
                }
                var left = rect.left || 0;
                var top = rect.top || 0;
                var width = rect.width;
                var height = rect.height;
                if (!rectAccordMatrix) {
                    var xscale = matrix[0][0];
                    var yscale = matrix[1][1];
                    var xdelta = matrix[2][0];
                    var ydelta = matrix[2][1];
                    left = left * xscale + xdelta;
                    top = top * yscale + ydelta;
                    width *= xscale;
                    height *= yscale;
                }
                var swidth = stageSize.width - padding * 2;
                var sheight = stageSize.height - padding * 2;
                var s = Math.min(swidth / Math.abs(width), sheight / Math.abs(height));
                var dx = (padding + swidth / 2) - s * (left + width / 2);
                var dy = (padding + sheight / 2) - s * (top + height / 2);
                return [
                    [s, 0, 0],
                    [0, s, 0],
                    [dx, dy, 1]
                ];
            },
            /**
             * 
             */
            calcRectZoomMatrix: function (target, origin, accord) {
                if (!accord) {
                    // TODO 
                    var s = (!origin.width && !origin.height) ? 1 : Math.min(target.height / Math.abs(origin.height), target.width / Math.abs(origin.width));
                    var dx = (target.left + target.width / 2) - s * (origin.left + origin.width / 2);
                    var dy = (target.top + target.height / 2) - s * (origin.top + origin.height / 2);
                    return [
                        [s, 0, 0],
                        [0, s, 0],
                        [dx, dy, 1]
                    ];
                } else {
                    var s = (!origin.width && !origin.height) ? 1 : Math.min(target.height / Math.abs(origin.height), target.width / Math.abs(origin.width));
                    var dx = (target.width / 2) - s * (origin.left - target.left + origin.width / 2);
                    var dy = (target.height / 2) - s * (origin.top - target.top + origin.height / 2);
                    return [
                        [s, 0, 0],
                        [0, s, 0],
                        [dx, dy, 1]
                    ];
                }
            }
        }
    });
})(nx);
(function (nx) {
    var sqrt = Math.sqrt;
    var square = nx.math.square;
    var abs = Math.abs;
    /**
     * @class Line
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Line", {
        statics: {
            getDistance: function (x1, y1, x2, y2) {
                return sqrt(square(x2 - x1) + square(y2 - y1));
            },
            getPointToSegment: function (x0, y0, x1, y1, x2, y2) {
                var A, B, C, D, u, ud, ud1, ud2;
                var xpedal, ypedal, dpedal;
                var xclosest, yclosest, dclosest;
                // check if it is a segment
                if (x1 == x2 && y1 == y2) {
                    // not a real segment
                    return;
                }
                // line: Ax+By+C=0
                A = y1 - y2, B = x2 - x1, C = x1 * y2 - x2 * y1;
                // 2D: unit=root(AA+BB)
                u = sqrt(A * A + B * B);
                // perpendicular: Bx-Ay+D=0
                D = A * y0 - B * x0;
                // united-distances from p1&p2 to perpendicular
                ud = A * x0 + B * y0 + C;
                ud1 = B * x1 - A * y1 + D;
                ud2 = B * x2 - A * y2 + D;
                // get pedal and its distance
                dpedal = abs(ud) / u;
                xpedal = -(C * A + B * D) / (A * A + B * B);
                ypedal = -(C * B - A * D) / (A * A + B * B);
                // check if pedal on the segment
                if (ud1 * ud2 > 0) {
                    // out of segment
                    if (abs(ud1) < abs(ud2)) {
                        xclosest = x1, yclosest = y1;
                        dclosest = sqrt(ud * ud + ud1 * ud1) / u;
                    } else {
                        xclosest = x2, yclosest = y2;
                        dclosest = sqrt(ud * ud + ud2 * ud2) / u;
                    }
                } else {
                    xclosest = xpedal, yclosest = ypedal, dclosest = dpedal;
                }
                return {
                    pedal: {
                        x: xpedal,
                        y: ypedal,
                        distance: dpedal
                    },
                    closest: {
                        x: xclosest,
                        y: yclosest,
                        distance: dclosest
                    }
                };
            },
            getPointParameters: function (point) {
                return {
                    x: point.length ? point[0] : point.x,
                    y: point.length ? point[1] : point.y
                };
            },
            getLineParameters: function (line) {
                if (!line.length) {
                    return line;
                }
                var p0 = line[0];
                var p1 = line[1];
                var x0 = p0.length ? p0[0] : p0.x;
                var x1 = p1.length ? p1[0] : p1.x;
                var y0 = p0.length ? p0[1] : p0.y;
                var y1 = p1.length ? p1[1] : p1.y;
                var A = y1 - y0;
                var B = x1 - x0;
                var C = x0 * y1 - x1 * y0;
                return {
                    A: A,
                    B: B,
                    C: C
                };
            },
            getDistanceFromPointToSegment: function (point, line) {
                var point = EXPORT.getPointParameters(point);
                var line = EXPORT.getLineParameters(line);
                return (line.A * point.x + line.B * point.y + line.C) / Math.sqrt(line.A * line.A + line.B * line.B);
            },
            getPointProjectionOnLine: function (point, line) {
                var point = EXPORT.getPointParameters(point);
                var line = EXPORT.getLineParameters(line);
                var P = line.A * point.y - line.B * point.x;
                var R = line.A * line.A + line.B * line.B;
                return {
                    x: -(line.A * line.C + line.B * P) / R,
                    y: -(line.B * line.C - line.A * P) / R
                };
            }
        }
    });
})(nx);
(function (nx) {
    var GeoMath = nx.geometry.Math;
    var Vector = nx.geometry.Vector;
    /**
     * @class BezierCurve
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.BezierCurve", {
        statics: (function () {
            var pascal = (function () {
                var triangle = [
                    [],
                    [1],
                    [1, 1]
                ];
                return function (n) {
                    if (triangle[n]) {
                        return triangle[n];
                    }
                    var i, last = pascal(n - 1);
                    var row = [];
                    for (i = 0; i < last.length - 1; i++) {
                        row[i] = last[i] + last[i + 1];
                    }
                    row.push(1);
                    row.unshift(1);
                    triangle[n] = row;
                    return row;
                };
            })();

            function transformBezierToPolyline(bezier) {
                var i, polyline = [];
                for (i = 0; i < bezier.length - 1; i++) {
                    polyline.push([bezier[i], bezier[i + 1]]);
                }
                return polyline;
            }

            function transformPolylineToBezier(polyline) {
                var i, bezier = [polyline[0][0]];
                for (i = 0; i < polyline.length; i++) {
                    bezier.push(polyline[i][1]);
                }
                return bezier;
            }

            function transformRecursiveSeparatePoints(rates) {
                var i = 0,
                    last = 0,
                    result = [];
                for (i = 0; i < rates.length; i++) {
                    if (i === rates.length - 1 && rates[i] === 1) {
                        break;
                    }
                    if (typeof rates[i] !== "number" || rates[i] <= last || rates[i] >= 1) {
                        throw "Invalid bread point list: " + rates.join(",");
                    }
                    result.push((rates[i] - last) / (1 - last));
                    last = rates[i];
                }
                return result;
            }
            return {
                slice: function (bezier, from, to) {
                    if (from === 0) {
                        if (to === 0) {
                            return null;
                        }
                        return EXPORT.breakdown(bezier, to).beziers[0];
                    } else if (!to) {
                        return EXPORT.breakdown(bezier, from).beziers[1];
                    } else {
                        return EXPORT.breakdown(bezier, from, to).beziers[1];
                    }
                },
                breakdown: function (bezier) {
                    // get the rest arguments
                    var rates = Array.prototype.slice.call(arguments, 1);
                    if (!rates.length) {
                        throw "Invalid argument length: " + arguments.length;
                    }
                    rates = transformRecursiveSeparatePoints(rates);
                    var rate, polyline, sep, points = [bezier[0]],
                        beziers = [];
                    // transform bezier points into lines
                    polyline = transformBezierToPolyline(bezier);
                    // iterate all rates
                    while (rates.length) {
                        // get the separate ratio
                        rate = rates.shift();
                        // separate the rest bezier
                        sep = EXPORT.separate(polyline, rate);
                        // mark the points and beziers
                        points.push(sep.point);
                        beziers.push(transformPolylineToBezier(sep.left));
                        // get the rest
                        polyline = sep.right;
                    }
                    // append the rest bezier
                    points.push(bezier[bezier.length - 1]);
                    beziers.push(transformPolylineToBezier(polyline));
                    return {
                        points: points,
                        beziers: beziers
                    };
                },
                /**
                 * @method separate
                 * @param polyline List of intervals (interval=[point-from, point-to], point=[x, y]).
                 * @param rate The rate to separate.
                 * @return {point:[x, y], left: leftPolyline, right: rightPolyline}
                 */
                separate: function separate(polyline, rate) {
                    var rest = 1 - rate;
                    var intervalSeparatePoint = function (interval) {
                        return [interval[0][0] * rest + interval[1][0] * rate, interval[0][1] * rest + interval[1][1] * rate];
                    };
                    var intervalInter = function (i1, i2) {
                        return [intervalSeparatePoint([i1[0], i2[0]]), intervalSeparatePoint([i1[1], i2[1]])];
                    };
                    var polylineLower = function (polyline) {
                        var i, rslt = [];
                        for (i = 0; i < polyline.length - 1; i++) {
                            rslt.push(intervalInter(polyline[i], polyline[i + 1]));
                        }
                        return rslt;
                    };
                    // start iterate
                    var point, left = [],
                        right = [];
                    var intervals = polyline,
                        interval;
                    while (intervals.length) {
                        interval = intervals[0];
                        left.push([interval[0], intervalSeparatePoint(interval)]);
                        interval = intervals[intervals.length - 1];
                        right.unshift([intervalSeparatePoint(interval), interval[1]]);
                        if (intervals.length == 1) {
                            point = intervalSeparatePoint(intervals[0]);
                        }
                        intervals = polylineLower(intervals);
                    }
                    return {
                        point: point,
                        left: left,
                        right: right
                    }
                },
                through: function (points, grade) {
                    // get default grade
                    if (grade === undefined) {
                        grade = points.length - 1;
                    }
                    // check if grade is too low
                    if (grade < 2) {
                        return null;
                    }
                    // TODO generalized algorithm for all grade
                    var anchors = [];
                    if (grade === 2) {
                        var A = points[0];
                        var B = points[2];
                        var X = points[1];
                        var O = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
                        var XX = [X[0] * 2 - O[0], X[1] * 2 - O[1]];
                        anchors.push(A, XX, B);
                    }
                    return anchors;
                },
                byLength: function (bezier, precision) {
                    precision = precision || 1;
                    var internal = {
                        length: 0,
                        map: [],
                        accumulate: function () {
                            var segment, segments = internal.separate(transformBezierToPolyline(bezier), 1);
                            var map = internal.map;
                            var length, rate, idx;
                            idx = length = rate = 0;
                            do {
                                // mark on map
                                idx = Math.round(length / precision);
                                map[idx] || (map[idx] = rate);
                                // accumulate length
                                segment = segments.shift();
                                if (!segment) {
				    // the last rate must be one
                                    map[idx] = 1;
                                    break;
                                }
                                length += segment.length;
                                rate += segment.rate;
                            } while (true);
                            internal.length = length;
                        },
                        separate: function (polyline, rate) {
                            var sep;
                            var pa = polyline[0][0];
                            var pb = polyline[polyline.length - 1][1];
                            var distance = internal.distance(pa, pb);
                            if (internal.approximate(polyline)) {
                                return [{
                                    length: distance,
                                    rate: rate
                                }];
                            } else {
                                sep = EXPORT.separate(polyline, 0.5);
                                pa = internal.separate(sep.left, rate / 2);
                                pb = internal.separate(sep.right, rate / 2);
                                return pa.concat(pb);
                            }
                        },
                        approximate: function (polyline) {
                            var i, pb, pa = polyline[0][0];
                            for (i = 0; i < polyline.length; i++) {
                                pb = polyline[i][1];
                                if (Math.abs(pb[1] - pa[1]) + Math.abs(pb[0] - pa[0]) > precision) {
                                    return false;
                                }
                            }
                            return true;
                        },
                        distance: function (p1, p2) {
                            var dx = p2[0] - p1[0];
                            var dy = p2[1] - p1[0];
                            return Math.sqrt(dx * dx + dy * dy);
                        }
                    };
                    internal.accumulate();
                    var result = {
                        length: internal.length,
                        mapped: function (percentage) {
                            return internal.map[Math.round(internal.length * percentage / precision)];
                        },
                        slice: function (from, to) {
                            return EXPORT.slice(bezier, result.mapped(from), result.mapped(to));
                        },
                        breakdown: function () {
                            var args = Array.prototype.slice.call(arguments).map(result.mapped);
                            args.unshift(bezier);
                            return EXPORT.breakdown.apply(this, args);
                        }
                    };
                    return result;
                }
            };
        })()
    });
})(nx);
(function (nx) {
    /**
     * @class Vector
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Vector", {
        statics: {
            approximate: function (v1, v2, precision) {
                if (!v1 || !v2 || v1.length != v2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < v1.length; i++) {
                    if (!nx.geometry.Math.approximate(v1[i], v2[i], precision)) {
                        return false;
                    }
                }
                return true;
            },
            equal: function (v1, v2) {
                if (!v1 || !v2 || v1.length != v2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < v1.length; i++) {
                    if (v1[i] !== v2[i]) {
                        return false;
                    }
                }
                return true;
            },
            plus: function (v1, v2) {
                return [v1[0] + v2[0], v1[1] + v2[1]];
            },
            transform: function (v, m) {
                var matrices = [[v.concat([1])]].concat(Array.prototype.slice.call(arguments, 1));
                return nx.geometry.Matrix.multiply.apply(nx.geometry.Matrix, matrices)[0].slice(0, 2);
            },
            multiply: function (v, k) {
                return EXPORT.transform(v, [[k, 0, 0], [0, k, 0], [0, 0, 1]]);
            },
            abs: function (v, len) {
                if (arguments.length == 1) {
                    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
                }
                var weight = len / EXPORT.abs(v);
                return EXPORT.transform(v, [[weight, 0, 0], [0, weight, 0], [0, 0, 1]]);
            },
            reverse: function (v) {
                return EXPORT.transform(v, [[-1, 0, 0], [0, -1, 0], [0, 0, 1]]);
            },
            rotate: function (v, a) {
                var sin = nx.geometry.Math.sin(a), cos = nx.geometry.Math.cos(a);
                return EXPORT.transform(v, [[cos, sin, 0], [-sin, cos, 0], [0, 0, 1]]);
            }
        }
    });
})(nx);
(function (nx) {
    nx.define("nx.geometry.MatrixSupport", {
        properties: {
            matrix: {
                value: function () {
                    return nx.geometry.Matrix.I;
                }
            },
            transform_internal_: {
                dependencies: "matrix",
                value: function (matrix) {
                    if (!matrix) {
                        return this._transform_internal_ || {
                            x: 0,
                            y: 0,
                            scale: 1,
                            rotate: 0
                        };
                    }
                    var scale = NaN,
                        rotate = NaN;
                    if (nx.geometry.Matrix.isometric(matrix)) {
                        scale = Math.sqrt(matrix[0][0] * matrix[0][0] + matrix[0][1] * matrix[0][1]);
                        rotate = Math.atan2(matrix[1][0], matrix[0][0]);
                    }
                    return {
                        x: matrix[2][0],
                        y: matrix[2][1],
                        scale: scale,
                        rotate: rotate
                    };
                }
            },
            x: {
                value: 0,
                set: function (v) {
                    this._applyTransform("x", v);
                    return false;
                }
            },
            y: {
                value: 0,
                set: function (v) {
                    this._applyTransform("y", v);
                    return false;
                }
            },
            scale: {
                value: 1,
                set: function (v) {
                    this._applyTransform("scale", v);
                    return false;
                }
            },
            rotate: {
                value: 0,
                set: function (v) {
                    this._applyTransform("rotate", v);
                    return false;
                }
            }
        },
        methods: {
            init: function () {
                this.inherited();
                this.retain(nx.Object.affectBinding(this, "x", nx.binding("transform_internal_.x", true, function (property, x) {
                    if (!isNaN(this._transform_internal_.x) && this._x !== this._transform_internal_.x) {
                        this._x = this._transform_internal_.x;
                        this.notify(x);
                    }
                }.bind(this))));
                this.retain(nx.Object.affectBinding(this, "y", nx.binding("transform_internal_.y", true, function (property, y) {
                    if (!isNaN(this._transform_internal_.y) && this._y !== this._transform_internal_.y) {
                        this._y = this._transform_internal_.y;
                        this.notify("y");
                    }
                }.bind(this))));
                this.retain(nx.Object.affectBinding(this, "scale", nx.binding("transform_internal_.scale", true, function (property, scale) {
                    if (!isNaN(this._transform_internal_.scale) && this._scale !== this._transform_internal_.scale) {
                        this._scale = this._transform_internal_.scale;
                        this.notify(scale);
                    }
                }.bind(this))));
                this.retain(nx.Object.affectBinding(this, "rotate", nx.binding("transform_internal_.rotate", true, function (property, rotate) {
                    if (!isNaN(this._transform_internal_.rotate) && this._rotate !== this._transform_internal_.rotate) {
                        this._rotate = this._transform_internal_.rotate;
                        this.notify(rotate);
                    }
                }.bind(this))));
            },
            getMatrixInversion: function () {
                var matrix = this.matrix();
                if (!matrix) {
                    return null;
                }
                return nx.geometry.Matrix.inverse(matrix);
            },
            applyTranslate: function (x, y) {
                this.matrix(nx.geometry.Matrix.multiply(this.matrix(), [
                    [1, 0, 0],
                    [0, 1, 0],
                    [x, y, 1]
                ]));
            },
            applyScale: function (s, accord) {
                if (accord) {
                    this.matrix(nx.geometry.Matrix.multiply(this.matrix(), [
                        [1, 0, 0],
                        [0, 1, 0],
                        [-accord[0], -accord[1], 1]
                    ], [
                        [s, 0, 0],
                        [0, s, 0],
                        [0, 0, 1]
                    ], [
                        [1, 0, 0],
                        [0, 1, 0],
                        [accord[0], accord[1], 1]
                    ]));
                } else {
                    this.matrix(nx.geometry.Matrix.multiply(this.matrix(), [
                        [s, 0, 0],
                        [0, s, 0],
                        [0, 0, 1]
                    ]));
                }
            },
            applyRotate: function (r, accord) {
                var x = this.x(),
                    y = this.y(),
                    sin = Math.sin(r),
                    cos = Math.cos(r);
                if (accord) {
                    this.matrix(nx.geometry.Matrix.multiply(this.matrix(), [
                        [1, 0, 0],
                        [0, 1, 0],
                        [-accord[0], -accord[1], 1]
                    ], [
                        [cos, sin, 0],
                        [-sin, cos, 0],
                        [0, 0, 1]
                    ], [
                        [1, 0, 0],
                        [0, 1, 0],
                        [accord[0], accord[1], 1]
                    ]));
                } else {
                    this.matrix(nx.geometry.Matrix.multiply(this.matrix(), [
                        [cos, sin, 0],
                        [-sin, cos, 0],
                        [0, 0, 1]
                    ]));
                }
            },
            applyMatrix: function () {
                var matrices = Array.prototype.slice.call(arguments);
                matrices = nx.array.query({
                    array: matrices,
                    mapping: function (matrix) {
                        return nx.is(matrix, nx.geometry.Matrix) ? matrix.matrix() : matrix;
                    }
                });
                matrices.unshift(this.matrix());
                this.matrix(nx.geometry.Matrix.multiply.apply(this, matrices));
            },
            _applyTransform: function (key, value) {
                if (this["_" + key] === value || isNaN(value)) {
                    return;
                }
                if (value === this._transform_internal_[key]) {
                    this["_" + key] = value;
                    this.notify(key);
                } else {
                    switch (key) {
                    case "x":
                        this.applyTranslate(value - this._transform_internal_.x, 0);
                        break;
                    case "y":
                        this.applyTranslate(0, value - this._transform_internal_.y);
                        break;
                    case "scale":
                        this.applyScale(value / this._transform_internal_.scale, [this._transform_internal_.x, this._transform_internal_.y]);
                        break;
                    case "rotate":
                        this.applyRotate(value - this._transform_internal_.rotate, [this._transform_internal_.x, this._transform_internal_.y]);
                        break;
                    }
                }
            }
        }
    })
})(nx);
(function(nx) {
    /**
     * @class Matrix
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Matrix", {
        mixins: [nx.geometry.MatrixSupport],
        methods: {
            init: function(matrix) {
                this.inherited();
                // TODO better pre-check
                this.matrix(matrix ? nx.clone(matrix) : EXPORT.I);
            },
            equal: function(matrix) {
                return EXPORT.equal(this.matrix(), (nx.is(matrix, EXPORT) ? matrix.matrix() : matrix));
            }
        },
        statics: {
            I: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ],
            isometric: function(m) {
                return m && (m[0][0] || m[0][1]) && m[0][0] === m[1][1] && m[0][1] === -m[1][0];
            },
            approximate: function(m1, m2, precision) {
                if (!m1 || !m2 || m1.length != m2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < m1.length; i++) {
                    if (!nx.geometry.Vector.approximate(m1[i], m2[i], precision)) {
                        return false;
                    }
                }
                return true;
            },
            equal: function(m1, m2) {
                if (!m1 || !m2 || m1.length != m2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < m1.length; i++) {
                    if (!nx.geometry.Vector.equal(m1[i], m2[i])) {
                        return false;
                    }
                }
                return true;
            },
            multiply: function() {
                var matrixes = Array.prototype.slice.call(arguments);
                var m1, m2, m, mr, mc, r, c, n, row, col, num;
                var i, j, k;
                while (matrixes.length > 1) {
                    m1 = matrixes[0], m2 = matrixes[1];
                    if (m1[0].length != m2.length) {
                        return null;
                    }
                    row = m1.length, col = m2[0].length, num = m2.length;
                    m = [];
                    for (r = 0; r < row; r++) {
                        mr = [];
                        for (c = 0; c < col; c++) {
                            mc = 0;
                            for (n = 0; n < num; n++) {
                                mc += m1[r][n] * m2[n][c];
                            }
                            mr.push(mc);
                        }
                        m.push(mr);
                    }
                    matrixes.splice(0, 2, m);
                }
                return matrixes[0];
            },
            transpose: function(m) {
                var t = [],
                    r, c, row = m.length,
                    col = m[0].length;
                for (c = 0; c < col; c++) {
                    t[c] = [];
                    for (r = 0; r < row; r++) {
                        t[c].push(m[r][c]);
                    }
                }
                return t;
            },
            cofactor: function(m, r, c) {
                var mc = m.map(function(row, index) {
                    if (index !== r) {
                        row = row.slice();
                        row.splice(c, 1);
                        return row;
                    }
                });
                mc.splice(r, 1);
                return mc;
            },
            determinant: function(m) {
                if (m.length == 1) {
                    return m[0][0];
                }
                // optimize for m of 2
                if (m.length == 2) {
                    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
                }
                // optimize for m of 3
                if (m.length == 3) {
                    return (
                        m[0][0] * m[1][1] * m[2][2] +
                        m[0][1] * m[1][2] * m[2][0] +
                        m[0][2] * m[1][0] * m[2][1] -
                        m[0][0] * m[1][2] * m[2][1] -
                        m[0][1] * m[1][0] * m[2][2] -
                        m[0][2] * m[1][1] * m[2][0]
                    );
                }
                // Laplace Theorem
                var rests = m.map(function(row) {
                    return row.slice(1);
                });
                var result, i, cofactor, cv, sign;
                for (result = 0, i = 0, cofactor = rests.slice(1), sign = 1; i < m.length; cofactor.splice(i, 1, rests[i]), i++, sign = -sign) {
                    if (m[i][0]) {
                        var cv = EXPORT.determinant(cofactor);
                        result += sign * m[i][0] * cv;
                    }
                }
                return result;
            },
            inverse: function(m) {
                var d = EXPORT.determinant(m);
                if (!d) {
                    return null;
                }
                return m.map(function(row, r) {
                    return row.map(function(value, c) {
                        var sign = (r + c) % 2 ? -1 : 1;
                        var cofactor = EXPORT.cofactor(m, c, r);
                        return sign * EXPORT.determinant(cofactor) / d;
                    });
                });
            },
            getHomogeneousLinearEquationsResults: function(equations) {
                // Cramer Rule
                var d = EXPORT.determinant(equations.map(function(row) {
                    return row.slice(0, row.length - 1);
                }));
                if (!d) {
                    return null;
                }
                return equations.map(function(row, index) {
                    return EXPORT.determinant(equations.map(function(row) {
                        row = row.slice();
                        row.splice(index, 1, row.pop());
                        return row;
                    })) / d;
                });
            },
            getEstimateGeometricTransformMatrix2D: function(reflects) {
                var i, j, k, tuple, marg, margs = [];
                // for each tuple of 3
                i = 0, j = 1, k = 2;
                while (true) {
                    // get the tuple
                    tuple = [reflects[i], reflects[j], reflects[k]];
                    // calculate the matrix
                    marg = EXPORT.getHomogeneousLinearEquationsResults([
                        [tuple[0][0][0], tuple[0][0][1], 1, 0, 0, 0, tuple[0][1][0]],
                        [0, 0, 0, tuple[0][0][0], tuple[0][0][1], 1, tuple[0][1][1]],
                        [tuple[1][0][0], tuple[1][0][1], 1, 0, 0, 0, tuple[1][1][0]],
                        [0, 0, 0, tuple[1][0][0], tuple[1][0][1], 1, tuple[1][1][1]],
                        [tuple[2][0][0], tuple[2][0][1], 1, 0, 0, 0, tuple[2][1][0]],
                        [0, 0, 0, tuple[2][0][0], tuple[2][0][1], 1, tuple[2][1][1]]
                    ]);
                    // store the matrix arguments
                    marg && margs.push(marg);
                    // next loop
                    if (++k > reflects.length - 1) {
                        if (++j > reflects.length - 2) {
                            if (++i > reflects.length - 3) {
                                break;
                            }
                            j = i + 1;
                            k = j + 1;
                        } else {
                            k = j + 1;
                        }
                    }
                }
                // check if the reflects are linear-correlation
                if (!margs.length) {
                    return null;
                }
                // check the variance of these matrices
                marg = margs[0].map(function(x, index) {
                    var values, expectation, variance;
                    values = margs.map(function(marg) {
                        return marg[index];
                    })
                    expectation = values.reduce(function(sum, v) {
                        return sum + v;
                    }, 0) / values.length;
                    variance = values.reduce(function(sum, v) {
                        return sum + v * v;
                    }, 0) / values.length - expectation * expectation;
                    // TODO check the variance
                    return expectation;
                });
                // get the average matrix
                return Array([marg[0], marg[3], 0], [marg[1], marg[4], 0], [marg[2], marg[5], 1]);
            }
        }
    });
})(nx);
