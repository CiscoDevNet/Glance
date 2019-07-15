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
(function (nx) {

    var global = nx.global;
    var document = global.document;
    var ua = navigator.userAgent.toLowerCase();
    var os = (function () {
        var os, patterns = {
            "windows": /windows|win32/,
            "macintosh": /macintosh|mac_powerpc/,
            "linux": /linux/
        };
        for (os in patterns) {
            if (patterns[os].test(ua)) {
                return os;
            }
        }
        return "other";
    })();

    var browser = (function () {
        var getVersionByPrefix = function (prefix) {
            var match = new RegExp(prefix + '(\\d+\\.\\d+)').exec(ua);
            return match ? parseFloat(match[1]) : 0;
        };
        var browser, browsers = [{
            tests: [/msie/, /^(?!.*opera)/],
            name: "ie",
            version: getVersionByPrefix("msie "),
            prefix: "ms", // not checked
            cssPrefix: "-ms-",
            engine: {
                name: "trident",
                version: getVersionByPrefix("trident\\/") || 4
            }
        }, {
            tests: [/gecko/, /^(?!.*webkit)/],
            name: "firefox",
            version: getVersionByPrefix("\\bfirefox\/"),
            prefix: "Moz",
            cssPrefix: "-moz-",
            engine: {
                name: "gecko",
                version: getVersionByPrefix("rv:") || 4
            }
        }, {
            tests: [/\bchrome\b/],
            name: "chrome",
            version: getVersionByPrefix('\\bchrome\/'),
            prefix: "webkit",
            cssPrefix: "-webkit-",
            engine: {
                name: 'webkit',
                version: getVersionByPrefix('webkit\\/')
            }
        }, {
            tests: [/safari/, /^(?!.*\bchrome\b)/],
            name: "safari",
            version: getVersionByPrefix('version\/'),
            prefix: "webkit",
            cssPrefix: "-webkit-",
            engine: {
                name: 'webkit',
                version: getVersionByPrefix('webkit\\/')
            }
        }, {
            tests: [/opera/],
            name: "opera",
            version: getVersionByPrefix('version\/'),
            prefix: "O",
            cssPrefix: "-o-",
            engine: {
                name: getVersionByPrefix("presto\\/") ? "presto" : "webkit",
                version: getVersionByPrefix("presto\\/") || getVersionByPrefix("webkit\\/")
            }
        }];
        // do browser determination one by one
        while (browsers.length) {
            browser = browsers.shift();
            while (browser.tests.length) {
                if (!browser.tests[0].test(ua)) {
                    break;
                }
                browser.tests.shift();
            }
            if (browser.tests.length) {
                continue;
            }
            delete browser.tests;
            return browser;
        }
        return {
            name: "other",
            version: 0,
            engine: {
                name: "unknown",
                version: 0
            }
        };
    })();

    var ie = browser.name === "ie" && browser.version;
    var tempElement = document.createElement('div');
    var tempStyle = tempElement.style;

    /**
     * 
     * @class env
     * @namespace nx
     */
    nx.define("nx.env", {
        statics: {
            /**
             * The document mode.
             *
             * @static
             * @property documentMode
             */
            documentMode: document.documentMode || 0,
            /**
             * In compat mode or not.
             *
             * @static
             * @property compatMode
             */
            compatMode: document.compatMode,
            /**
             * In strict mode or not.
             *
             * @static
             * @property strict
             */
            strict: document.compatMode === "CSS1Compat",
            /**
             * Using secure connection or not.
             *
             * @static
             * @property secure
             */
            secure: location.protocol.toLowerCase() === "https:",
            /**
             * Same as navigator.userAgent.
             *
             * @static
             * @property userAgent
             */
            userAgent: ua,
            /**
             * Operating system: windows, macintosh, linux or other.
             *
             * @static
             * @property os
             */
            os: os,
            /**
             * The browser's name, version, prefix/cssPrefix, and engine.
             * The engine contains its name and version.
             *
             * @static
             * @property browser
             */
            browser: browser,
            /**
             * The support status to some special features of current browser.
             *
             * @static
             * @property SUPPORT_MAP
             */
            SUPPORT_MAP: {
                addEventListener: !!document.addEventListener,
                dispatchEvent: !!document.dispatchEvent,
                getBoundingClientRect: !!document.documentElement.getBoundingClientRect,
                onmousewheel: 'onmousewheel' in document,
                XDomainRequest: !!window.XDomainRequest,
                crossDomain: !!(window.XDomainRequest || window.XMLHttpRequest),
                getComputedStyle: 'getComputedStyle' in window,
                iePropertyChange: !!(ie && ie < 9),
                w3cChange: !ie || ie > 8,
                w3cFocus: !ie || ie > 8,
                w3cInput: !ie || ie > 9,
                innerText: 'innerText' in tempElement,
                firstElementChild: 'firstElementChild' in tempElement,
                cssFloat: 'cssFloat' in tempStyle,
                opacity: (/^0.55$/).test(tempStyle.opacity),
                filter: 'filter' in tempStyle,
                classList: !!tempElement.classList,
                removeProperty: 'removeProperty' in tempStyle,
                touch: 'ontouchstart' in document.documentElement
            },
            /**
             * Some key code of known keys.
             *
             * @static
             * @property KEY_MAP
             */
            KEY_MAP: {
                BACKSPACE: 8,
                TAB: 9,
                CLEAR: 12,
                ENTER: 13,
                SHIFT: 16,
                CTRL: 17,
                ALT: 18,
                META: (browser.name === "chrome" || browser.name === "webkit" || browser.name === "safari") ? 91 : 224, // the apple key on macs
                PAUSE: 19,
                CAPS_LOCK: 20,
                ESCAPE: 27,
                SPACE: 32,
                PAGE_UP: 33,
                PAGE_DOWN: 34,
                END: 35,
                HOME: 36,
                LEFT_ARROW: 37,
                UP_ARROW: 38,
                RIGHT_ARROW: 39,
                DOWN_ARROW: 40,
                INSERT: 45,
                DELETE: 46,
                HELP: 47,
                LEFT_WINDOW: 91,
                RIGHT_WINDOW: 92,
                SELECT: 93,
                NUMPAD_0: 96,
                NUMPAD_1: 97,
                NUMPAD_2: 98,
                NUMPAD_3: 99,
                NUMPAD_4: 100,
                NUMPAD_5: 101,
                NUMPAD_6: 102,
                NUMPAD_7: 103,
                NUMPAD_8: 104,
                NUMPAD_9: 105,
                NUMPAD_MULTIPLY: 106,
                NUMPAD_PLUS: 107,
                NUMPAD_ENTER: 108,
                NUMPAD_MINUS: 109,
                NUMPAD_PERIOD: 110,
                NUMPAD_DIVIDE: 111,
                F1: 112,
                F2: 113,
                F3: 114,
                F4: 115,
                F5: 116,
                F6: 117,
                F7: 118,
                F8: 119,
                F9: 120,
                F10: 121,
                F11: 122,
                F12: 123,
                F13: 124,
                F14: 125,
                F15: 126,
                NUM_LOCK: 144,
                SCROLL_LOCK: 145
            }
        }
    });
})(nx);
nx.ready = function (fn) {
    var callback, called, resources = new nx.Object();
    callback = function () {
        resources.release("recursive");
        // initialize to make sure we got a class or function
        if (typeof fn === "string") {
            fn = nx.path(global, fn);
        }
        // attach the class or call a function
        var instance, node;
        if (typeof fn === "function") {
            if (!fn.__nx__) {
                resources.retain("recursive", fn(resources));
                return;
            }
            instance = new fn();
        } else {
            instance = fn;
        }
        // check if the instance has 'dom' property
        node = nx.path(instance, "dom");
        if (node instanceof Node) {
            document.body.appendChild(node);
            resources.retain("recursive", {
                release: function () {
                    document.body.removeChild(node);
                    instance.release();
                }
            });
        } else {
            resources = instance;
        }
    };
    // make sure to call the callback, even if loaded.
    if (document.readyState === "interactive" || document.readyState === "complete") {
        callback();
    } else {
        window.addEventListener("load", callback);
        resources.retain("recursive", {
            release: function () {
                window.removeEventListener("load", callback);
            }
        });
    }
    return resources;
};
(function(nx) {
    var EXPORT = nx.path(nx.global, "nx.util.url", function() {
        var href = window.location.href;
        var hash = window.location.hash;
        var search = href.indexOf("?") >= 0 && href.substring(href.indexOf("?") + 1);
        if (search && search.indexOf("#") >= 0) {
            search = search.substring(0, search.indexOf("#"));
        }
        var protocol = window.location.protocol;
        var host = window.location.host;
        var hostname = window.location.hostname;
        var port = window.location.port;
        var pathname = window.location.pathname;
        if (search) {
            search = search.split("&").reduce(function(data, arg) {
                var key, value, idx = arg.indexOf("=");
                if (idx >= 0) {
                    key = decodeURI(arg.substring(0, idx));
                    value = decodeURI(arg.substring(idx + 1));
                } else {
                    key = decodeURI(arg);
                    value = true;
                }
                data[key] = value;
                return data;
            }, {});
        }
        if (hash) {
            hash = hash.split("&").reduce(function(data, arg) {
                var key, value, idx = arg.indexOf("=");
                if (idx >= 0) {
                    key = decodeURI(arg.substring(0, idx));
                    value = decodeURI(arg.substring(idx + 1));
                } else {
                    key = decodeURI(arg);
                    value = null;
                }
                data[key] = value;
                return data;
            }, {});
        }
        return {
            href: href,
            protocol: protocol,
            host: host,
            hostport: host,
            hostname: hostname,
            port: port,
            pathname: pathname,
            search: search,
            hash: hash
        };
    }());
})(nx);
(function (nx) {
    var EXPORT = nx.define("nx.util.fullscreen", {
        statics: {
            status: function () {
                return !document.fullscreenElement && // alternative standard method
                    !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement;
            },
            toggle: function (fullscreen) {
                var isFullScreen = EXPORT.status();
                EXPORT.set(!isFullScreen);
            },
            set: function (fullscreen) {
                if (fullscreen) { // current working methods
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    } else if (document.documentElement.msRequestFullscreen) {
                        document.documentElement.msRequestFullscreen();
                    } else if (document.documentElement.mozRequestFullScreen) {
                        document.documentElement.mozRequestFullScreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            }
        }
    });
})(nx);
(function (nx) {
    var browser = nx.env.browser;
    var prefix = browser.cssPrefix;

    // XXX dom.className is object in PhantomJS ?!

    var EXPORT = nx.define("nx.util.cssclass", {
        static: true,
        methods: {
            has: function (dom, name) {
                if (dom.classList) {
                    return dom.classList.contains(name);
                }
                return (" " + dom.className + " ").indexOf(" " + name + " ") >= 0;
            },
            add: function (dom, name) {
                if (dom.classList) {
                    dom.classList.add(name);
                    return String(dom.className);
                }
                if (!this.has(dom, name)) {
                    dom.className = (dom.className || "") + " " + name;
                }
                return String(dom.className);
            },
            remove: function (dom, name) {
                if (dom.classList) {
                    return dom.classList.remove(name);
                }
                // TODO optimizable?
                return dom.className = String(dom.className || "")
                    .split(" ")
                    .filter(function (cname) {
                        return cname && cname !== name;
                    })
                    .join(" ");
            },
            toggle: function (dom, name, existance) {
                if (arguments.length > 2) {
                    return existance ? this.add(dom, name) : this.remove(dom, name);
                } else {
                    if (dom.classList) {
                        return dom.classList.toggle(name);
                    } else {
                        if (this.has(dom, name)) {
                            this.remove(dom, name);
                        } else {
                            this.add(dom, name);
                        }
                    }
                }
            }
        }
    });
})(nx);
(function(nx) {
    var browser = nx.env.browser;
    var prefix = browser.cssPrefix;

    var EXPORT = nx.define("nx.util.cssstyle", {
        static: true,
        methods: {
            has: function(dom, key) {
                var css = dom.style.cssText;
                return css.indexOf(key) === 0 || css.indexOf(prefix + key) === 0;
            },
            get: function(dom, key) {
                return dom.style[EXPORT.camelize(key)];
            },
            getBound: function(dom) {
                var b = dom.getBoundingClientRect();
                return {
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height,
                    right: b.right,
                    bottom: b.bottom
                };
            },
            set: function(dom, key, value) {
                if (typeof key !== "string") {
                    var str = "";
                    nx.each(key, function(value, key) {
                        var kv = EXPORT.stylize(key, value);
                        str += kv.text;
                    });
                    str = dom.style.cssText + str;
                    dom.style.cssText = str;
                    return str;
                } else {
                    var kv = EXPORT.stylize(key, value);
                    dom.style.cssText += kv.text;
                    return kv.value;
                }
            },
            remove: function(dom, key) {
                return dom.style.removeProperty(EXPORT.camelize(key));
            },
            camelize: function(key) {
                var result;
                switch (key) {
                    case "float":
                        result = "cssFloat";
                        break;
                    default:
                        if (key.indexOf(prefix) === 0) {
                            key = browser.prefix + key.substring(prefix.length - 1);
                        }
                        result = nx.string.camelize(key);
                        break;
                }
                return result;
            },
            stylize: function(key, value) {
                key = nx.string.uncamelize(key);
                var prefixKey, prefixValue, text = "";
                // TODO more special rules
                // TODO add "px" for measurable keys
                // TODO pre-process for cross browser: prefix of -webkit-, -moz-, -o-, etc.
                switch (key) {
                    case "left":
                    case "right":
                    case "top":
                    case "bottom":
                    case "width":
                    case "height":
                        if (typeof value === "number") {
                            // default unit: pixel
                            value = value + "px";
                        }
                        break;
                    case "display":
                        if (typeof value !== "string") {
                            value = (!!value) ? "" : "none";
                        } else if (value === "flex") {
                            prefixValue = prefix + value;
                        }
                        break;
                    case "user-select": // user-select
                    case "transform-origin":
                    case "transform-style":
                    case "animation": // animation
                    case "animation-name":
                    case "animation-duration":
                    case "animation-delay":
                    case "animation-iteration-count":
                    case "animation-timing-function":
                    case "animation-fill-mode":
                    case "flex-direction": // flex box parent
                    case "flex-flow":
                    case "flex-wrap":
                    case "justify-content":
                    case "align-content":
                    case "align-items":
                    case "flex": // flex box child
                    case "order":
                    case "flex-grow":
                    case "flex-shrink":
                    case "flex-basis":
                    case "align-self":
                        prefixKey = prefix + key;
                        break;
                    case "content":
                        value = "\"" + value + "\"";
                        break;
                    case "background-image":
                        prefixValue = value.replace(/\S*gradient\(/gi, function(match) {
                            return prefix + match;
                        });
                        break;
                    case "transform": // transform
                        prefixKey = prefix + key;
                        if (nx.is(value, Array)) {
                            if (value.length == 3) {
                                value = EXPORT.toCssTransformMatrix(value);
                            } else if (value.length === 4) {
                                value = EXPORT.toCssTransformMatrix3d(value);
                            }
                        }
                }
                // create text
                if (prefixKey) {
                    text += prefixKey + ":" + (prefixValue || value) + ";";
                } else if (prefixValue) {
                    text += key + ":" + prefixValue + ";";
                }
                text += key + ":" + value + ";";
                return {
                    key: key,
                    prefixKey: prefixKey,
                    value: value,
                    prefixValue: prefixValue,
                    text: text
                };
            },
            toRgbaArray: (function() {
                // FIXME if ES6 not supported
                var COLORS = {
                    "aliceblue": [240, 248, 255, 1],
                    "antiquewhite": [250, 235, 215, 1],
                    "aqua": [0, 255, 255, 1],
                    "aquamarine": [127, 255, 212, 1],
                    "azure": [240, 255, 255, 1],
                    "beige": [245, 245, 220, 1],
                    "bisque": [255, 228, 196, 1],
                    "black": [0, 0, 0, 1],
                    "blanchedalmond": [255, 235, 205, 1],
                    "blue": [0, 0, 255, 1],
                    "blueviolet": [138, 43, 226, 1],
                    "brown": [165, 42, 42, 1],
                    "burlywood": [222, 184, 135, 1],
                    "cadetblue": [95, 158, 160, 1],
                    "chartreuse": [127, 255, 0, 1],
                    "chocolate": [210, 105, 30, 1],
                    "coral": [255, 127, 80, 1],
                    "cornflowerblue": [100, 149, 237, 1],
                    "cornsilk": [255, 248, 220, 1],
                    "crimson": [220, 20, 60, 1],
                    "cyan": [0, 255, 255, 1],
                    "darkblue": [0, 0, 139, 1],
                    "darkcyan": [0, 139, 139, 1],
                    "darkgoldenrod": [184, 134, 11, 1],
                    "darkgray": [169, 169, 169, 1],
                    "darkgrey": [169, 169, 169, 1],
                    "darkgreen": [0, 100, 0, 1],
                    "darkkhaki": [189, 183, 107, 1],
                    "darkmagenta": [139, 0, 139, 1],
                    "darkolivegreen": [85, 107, 47, 1],
                    "darkorange": [255, 140, 0, 1],
                    "darkorchid": [153, 50, 204, 1],
                    "darkred": [139, 0, 0, 1],
                    "darksalmon": [233, 150, 122, 1],
                    "darkseagreen": [143, 188, 143, 1],
                    "darkslateblue": [72, 61, 139, 1],
                    "darkslategray": [47, 79, 79, 1],
                    "darkslategrey": [47, 79, 79, 1],
                    "darkturquoise": [0, 206, 209, 1],
                    "darkviolet": [148, 0, 211, 1],
                    "deeppink": [255, 20, 147, 1],
                    "deepskyblue": [0, 191, 255, 1],
                    "dimgray": [105, 105, 105, 1],
                    "dimgrey": [105, 105, 105, 1],
                    "dodgerblue": [30, 144, 255, 1],
                    "firebrick": [178, 34, 34, 1],
                    "floralwhite": [255, 250, 240, 1],
                    "forestgreen": [34, 139, 34, 1],
                    "fuchsia": [255, 0, 255, 1],
                    "gainsboro": [220, 220, 220, 1],
                    "ghostwhite": [248, 248, 255, 1],
                    "gold": [255, 215, 0, 1],
                    "goldenrod": [218, 165, 32, 1],
                    "gray": [128, 128, 128, 1],
                    "grey": [128, 128, 128, 1],
                    "green": [0, 128, 0, 1],
                    "greenyellow": [173, 255, 47, 1],
                    "honeydew": [240, 255, 240, 1],
                    "hotpink": [255, 105, 180, 1],
                    "IndianRed": [205, 92, 92, 1],
                    "Indigo": [75, 0, 130, 1],
                    "ivory": [255, 255, 240, 1],
                    "khaki": [240, 230, 140, 1],
                    "lavender": [230, 230, 250, 1],
                    "lavenderblush": [255, 240, 245, 1],
                    "lawngreen": [124, 252, 0, 1],
                    "lemonchiffon": [255, 250, 205, 1],
                    "lightblue": [173, 216, 230, 1],
                    "lightcoral": [240, 128, 128, 1],
                    "lightcyan": [224, 255, 255, 1],
                    "lightgoldenrodyellow": [250, 250, 210, 1],
                    "lightgray": [211, 211, 211, 1],
                    "lightgrey": [211, 211, 211, 1],
                    "lightgreen": [144, 238, 144, 1],
                    "lightpink": [255, 182, 193, 1],
                    "lightsalmon": [255, 160, 122, 1],
                    "lightseagreen": [32, 178, 170, 1],
                    "lightskyblue": [135, 206, 250, 1],
                    "lightslategray": [119, 136, 153, 1],
                    "lightslategrey": [119, 136, 153, 1],
                    "lightsteelblue": [176, 196, 222, 1],
                    "lightyellow": [255, 255, 224, 1],
                    "lime": [0, 255, 0, 1],
                    "limegreen": [50, 205, 50, 1],
                    "linen": [250, 240, 230, 1],
                    "magenta": [255, 0, 255, 1],
                    "maroon": [128, 0, 0, 1],
                    "mediumaquamarine": [102, 205, 170, 1],
                    "mediumblue": [0, 0, 205, 1],
                    "mediumorchid": [186, 85, 211, 1],
                    "mediumpurple": [147, 112, 219, 1],
                    "mediumseagreen": [60, 179, 113, 1],
                    "mediumslateblue": [123, 104, 238, 1],
                    "mediumspringgreen": [0, 250, 154, 1],
                    "mediumturquoise": [72, 209, 204, 1],
                    "mediumvioletred": [199, 21, 133, 1],
                    "midnightblue": [25, 25, 112, 1],
                    "mintcream": [245, 255, 250, 1],
                    "mistyrose": [255, 228, 225, 1],
                    "moccasin": [255, 228, 181, 1],
                    "navajowhite": [255, 222, 173, 1],
                    "navy": [0, 0, 128, 1],
                    "oldlace": [253, 245, 230, 1],
                    "olive": [128, 128, 0, 1],
                    "olivedrab": [107, 142, 35, 1],
                    "orange": [255, 165, 0, 1],
                    "orangered": [255, 69, 0, 1],
                    "orchid": [218, 112, 214, 1],
                    "palegoldenrod": [238, 232, 170, 1],
                    "palegreen": [152, 251, 152, 1],
                    "paleturquoise": [175, 238, 238, 1],
                    "palevioletred": [219, 112, 147, 1],
                    "papayawhip": [255, 239, 213, 1],
                    "peachpuff": [255, 218, 185, 1],
                    "peru": [205, 133, 63, 1],
                    "pink": [255, 192, 203, 1],
                    "plum": [221, 160, 221, 1],
                    "powderblue": [176, 224, 230, 1],
                    "purple": [128, 0, 128, 1],
                    "rebeccapurple": [102, 51, 153, 1],
                    "red": [255, 0, 0, 1],
                    "rosybrown": [188, 143, 143, 1],
                    "royalblue": [65, 105, 225, 1],
                    "saddlebrown": [139, 69, 19, 1],
                    "salmon": [250, 128, 114, 1],
                    "sandybrown": [244, 164, 96, 1],
                    "seagreen": [46, 139, 87, 1],
                    "seashell": [255, 245, 238, 1],
                    "sienna": [160, 82, 45, 1],
                    "silver": [192, 192, 192, 1],
                    "skyblue": [135, 206, 235, 1],
                    "slateblue": [106, 90, 205, 1],
                    "slategray": [112, 128, 144, 1],
                    "slategrey": [112, 128, 144, 1],
                    "snow": [255, 250, 250, 1],
                    "springgreen": [0, 255, 127, 1],
                    "steelblue": [70, 130, 180, 1],
                    "tan": [210, 180, 140, 1],
                    "teal": [0, 128, 128, 1],
                    "thistle": [216, 191, 216, 1],
                    "tomato": [255, 99, 71, 1],
                    "turquoise": [64, 224, 208, 1],
                    "violet": [238, 130, 238, 1],
                    "wheat": [245, 222, 179, 1],
                    "white": [255, 255, 255, 1],
                    "whitesmoke": [245, 245, 245, 1],
                    "yellow": [255, 255, 0, 1],
                    "yellowgreen": [154, 205, 50, 1]
                };
                var rRGBA = /rgba\((\d+),\s?(\d+),\s?(\d+),\s?(\d+|\d*\.\d+)\)/;
                var rRGB = /rgb\((\d+),\s?(\d+),\s?(\d+)\)/;
                return function(color, opacity) {
                    if (opacity === undefined) {
                        opacity = 1;
                    }
                    var r, g, b, a;
                    r = g = b = 0, a = 1;
                    if (COLORS[color]) {
                        [r, g, b, a] = COLORS[color];
                    } else if (color.charAt(0) === "#") {
                        [r, g, b] = [Number.parseInt(color.substring(1, 3), 16), Number.parseInt(color.substring(3, 5), 16), Number.parseInt(color.substring(5, 7), 16)]
                    } else if (rRGBA.test(color)) {
                        color.replace(rRGBA, function(match, xr, xg, xb, xa) {
                            [r, g, b, a] = [xr * 1, xg * 1, xb * 1, xa * 1];
                        });
                    } else if (rRGB.test(color)) {
                        color.replace(rRGB, function(match, xr, xg, xb) {
                            [r, g, b] = [xr * 1, xg * 1, xb * 1];
                            a = 1;
                        });
                    }
                    return [r, g, b, a * opacity];
                };
            })(),
            toMatrixByTransform: (function() {
                var rMatrix = /matrix\(.*\)/;
                var rComma = /\s*,\s*|\s+/;
                return function(transform) {
                    var matrix, numbers;
                    if (!transform) {
                        return;
                    }
                    if (rMatrix.test(transform)) {
                        numbers = transform.substring(7, transform.length - 1).split(rComma).map(function(v) {
                            return v * 1;
                        });
                        matrix = [
                            [numbers[0], numbers[1], 0],
                            [numbers[2], numbers[3], 0],
                            [numbers[4], numbers[5], 1]
                        ];
                    }
                    return matrix || nx.geometry.Matrix.I;
                };
            })(),
            toCssTransformMatrix: function(matrix) {
                if (!matrix) {
                    return "none";
                }
                // FIXME too big digit
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            },
            toCssTransformMatrix3d: function(matrix) {
                if (!matrix) {
                    return "none";
                }
                // FIXME too big digit
                var css = matrix.map(function(row) {
                    return row.join(",");
                }).join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix3d(" + css + ")";
            },
            toCssDisplayVisible: function(display) {
                return display ? "" : "none";
            }
        }
    });
})(nx);
(function(nx) {

    var PREFIX = nx.env.browser.cssPrefix;
    var stylize = nx.util.cssstyle.stylize;
    var uncamelize = nx.string.uncamelize;
    var camelize = nx.string.camelize;

    var KeyFrames = (function() {
        var KeyFrames = function(options) {
            if (!options.definition) {
                this.definition = options.definition;
            } else {
                this.definition = options.definition;
                var i, KEYS = KeyFrames.KEYS,
                    key;
                this.name = options.name || ("keyframes-" + nx.uuid());
                for (i = 1; i < KEYS.length; i++) {
                    key = KEYS[i];
                    this[key] = options[key] || options[camelize(key)];
                }
            }
        };
        KeyFrames.KEYS = ["name", "duration", "timing-function", "delay", "iteration-count", "direction", "fill-mode", "play-state"];
        KeyFrames.DEFAULTS = {
            "duration": "0s",
            "timing-function": "ease",
            "delay": "0s",
            "iteration-count": "infinite",
            "direction": "normal",
            "fill-mode": "none",
            "play-state": "running"
        };
        return KeyFrames;
    })();

    var EXCEPTIONS = {
        selector: {
            "::placeholder": {
                regexp: /::placeholder/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "input-placeholder";
                }
            },
            "::scrollbar": {
                regexp: /::scrollbar/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "scrollbar";
                }
            },
            "::scrollbar-track": {
                regexp: /::scrollbar-track/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "scrollbar-track";
                }
            },
            "::scrollbar-thumb": {
                regexp: /::scrollbar-thumb/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "scrollbar-thumb";
                }
            }
        }
    };

    var EXPORT = nx.define("nx.util.csssheet", {
        static: true,
        methods: {
            create: function create(identity, map, oncreate) {
                // optionalize arguments
                if (typeof identity !== "string") {
                    oncreate = map;
                    map = identity;
                    identity = "jss-" + nx.serial();
                }
                // make sure the creation will be called
                return nx.ready(function() {
                    // TODO for ie
                    // create the style node
                    var cssText = EXPORT.css(map);
                    var resource, style_node, head = document.getElementsByTagName("head")[0];
                    style_node = document.createElement("style");
                    style_node.setAttribute("id", identity);
                    style_node.setAttribute("type", "text/css");
                    style_node.setAttribute("media", "screen");
                    style_node.setAttribute("rel", "stylesheet");
                    style_node.appendChild(document.createTextNode(cssText));
                    // clear previous and append new
                    head.appendChild(style_node);
                    // callback when finally created
                    resource = oncreate && oncreate(style_node, identity);
                    return {
                        release: function() {
                            resource && resource.release();
                            resource = null;
                            style_node && head.removeChild(style_node);
                            style_node = null;
                        }
                    };
                });
            },
            css: function(css) {
                var selector, rules, texts = [""];
                for (selector in css) {
                    texts[0] += EXPORT._rule(texts, selector, css[selector]);
                }
                return texts.join("");
            },
            keyframes: function(options) {
                return new KeyFrames(options);
            },
            _pair: function(texts, key, value) {
                if (key.indexOf("nx:") === 0) {
                    return EXPORT._nxpair(texts, key.substring(3), value);
                }
                if (key === "animation" && value instanceof KeyFrames) {
                    if (!value.name) {
                        value.name = "keyframes-" + nx.uuid();
                    }
                    // create the KeyFrames in CSS text
                    texts.push("@" + PREFIX + "keyframes " + value.name + " {" + EXPORT.css(value.definition) + "}");
                    if (navigator.userAgent.indexOf("Safari/6") >= 0) {
                        // fix bug of animation on Safari 6
                        return (function(kf) {
                            // return the value setting
                            var i, key, value, kv;
                            var KEYS = KeyFrames.KEYS;
                            var DEFAULTS = KeyFrames.DEFAULTS;
                            var animation = [];
                            for (i = 0; i < KEYS.length; i++) {
                                key = KEYS[i];
                                if (kf[key] || typeof kf[key] === "number") {
                                    value = kf[key];
                                } else {
                                    value = DEFAULTS[key];
                                }
                                kv = stylize("animation-" + key, value);
                                animation.push(kv.text);
                            }
                            return animation.join("");
                        })(value);
                    }
                    value = (function(kf) {
                        // return the value setting
                        var i, key;
                        var KEYS = KeyFrames.KEYS;
                        var DEFAULTS = KeyFrames.DEFAULTS;
                        var animation = [];
                        for (i = 0; i < KEYS.length; i++) {
                            key = KEYS[i];
                            if (kf[key] || typeof kf[key] === "number") {
                                animation.push(kf[key]);
                            } else {
                                animation.push(DEFAULTS[key]);
                            }
                        }
                        return animation.join(" ");
                    })(value);
                }
                var kv = stylize(key, value);
                return kv.text;
            },
            _nxpair: function(texts, key, value) {
                var result;
                switch (key) {
                    case "fixed":
                    case "absolute":
                        if (typeof value === "string") {
                            value = nx.string.trim(value).split(/\s*[,\s]\s*/);
                        }
                        result = "position:" + key + ";";
                        if (value.length >= 4) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "right", value[1]));
                            value[2] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[2]));
                            value[3] !== "auto" && (result += EXPORT._pair(texts, "left", value[3]));
                        } else if (value.length === 3) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "right", value[1]));
                            value[2] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[2]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "left", value[1]));
                        } else if (value.length === 2) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "right", value[1]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "left", value[1]));
                        } else if (value.length === 1 && value[0]) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "right", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "left", value[0]));
                        }
                        break;
                    case "size":
                        if (typeof value === "string") {
                            value = nx.string.trim(value).split(/\s*[,\s]\s*/);
                        }
                        result = "";
                        if (value.length >= 2) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "width", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "height", value[1]));
                        } else if (value.length === 1 && value[0]) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "width", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "height", value[0]));
                        }
                        break;
                }
                return result;
            },
            _rule: function(texts, selector, rules) {
                var grouped = "",
                    key, value;
                if (rules instanceof KeyFrames) {
                    // create the KeyFrames in CSS text
                    texts.push("@" + PREFIX + "keyframes " + (selector) + " {" + EXPORT.css(rules.definition) + "}");
                    // other properties are ignored
                    return "";
                } else {
                    for (key in rules) {
                        value = rules[key];
                        grouped += EXPORT._pair(texts, key, value);
                    }
                    // fixup selector
                    nx.each(EXCEPTIONS.selector, function(value, key) {
                        if (selector.indexOf(key) >= 0) {
                            selector = selector.replace(value.regexp, value.handler);
                        }
                    });
                    return selector + "{" + grouped + "}";
                }
            }
        }
    });
})(nx);
(function(nx) {
    var browser = nx.env.browser;
    var prefix = browser.cssPrefix;

    var EXPORT = nx.define("nx.util.event", {
        statics: {
            supported: function(dom) {
                if (dom === window) {
                    return EXPORT.EVENTS_WINDOW.slice();
                }
                return EXPORT.EVENTS_BASIC.concat(EXPORT.EVENTS_TAG[dom.tagName.toLowerCase()]);
            },
            EVENTS_WINDOW: [
                "load",
                "unload",
                "resize"
            ],
            EVENTS_BASIC: [
                "click",
                "dblclick",
                "contextmenu",
                "mousedown",
                "mouseup",
                "mousemove",
                "mouseenter",
                "mouseleave",
                "mouseover",
                "mouseout",
                "keydown",
                "keyup",
                "keypress",
                "focus",
                "blur",
                "touchstart",
                "touchmove",
                "touchend",
                "touchcancel"
            ],
            EVENTS_TAG: {
                "form": [
                    "reset",
                    "submit"
                ],
                "input": [
                    "change",
                    "input"
                ],
                "textarea": [
                    "change",
                    "input"
                ],
                "select": [
                    "select"
                ],
                "img": [
                    "load",
                    "error"
                ]
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @namespace nx.util
     */
    var EXPORT = nx.define("nx.util.hash", {
        static: true,
        properties: {
            map: function() {
                return new nx.Map();
            }
        },
        methods: {
            init: function() {
                this.inherited();
                window.addEventListener("hashchange", this.onhashchange.bind(this));
                this.onhashchange();
            },
            getHashString: function() {
                var hash = window.location.hash;
                // FIXME the bug of browser: hash of "xxx#" is "", not "#"
                if (!hash) {
                    hash = window.location.href.indexOf("#");
                    if (hash >= 0) {
                        hash = window.location.href.substring(hash);
                    } else {
                        hash = "";
                    }
                }
                return hash;
            },
            getHashMap: function() {
                return this.toHashMap(this.getHashString());
            },
            setHashMap: function(map) {
                var hash = [];
                nx.each(map, function(value, key) {
                    if (key === "#") {
                        hash.unshift(value || "");
                    } else if (value || typeof value === "string") {
                        hash.push(key + "=" + value);
                    }
                });
                return window.location.href = "#" + hash.join("&");
            },
            onhashchange: function() {
                var maplast, map, hash = this.getHashString();
                map = this.toHashMap(hash);
                // get old map
                maplast = this._lastHashMap || {};
                // update map
                this.updateMap(maplast, map);
                // store the hash map
                this._lastHashMap = map;
                // fire hash change event
                this.fire("change", nx.global.location.href);
            },
            updateMap: function(maplast, map) {
                var dict = this.map();
                var has = Object.prototype.hasOwnProperty;
                nx.each(maplast, function(value, key) {
                    if (!has.call(map, key)) {
                        dict.remove(key);
                    }
                });
                nx.each(map, function(value, key) {
                    dict.set(key, value);
                });
            },
            toHashMap: function(hash) {
                if (!hash) {
                    return {};
                }
                var pairs, main, map = {};
                pairs = hash.substring(1).split("&");
                if (pairs[0].indexOf("=") === -1) {
                    map["#"] = pairs.shift();
                } else {
                    map["#"] = null;
                }
                nx.each(pairs, function(pair) {
                    pair = pair.split("=");
                    if (pair.length < 2) {
                        pair[1] = true;
                    }
                    map[pair[0]] = pair[1];
                });
                return map;
            }
        }
    });

})(nx);
(function(nx) {
    var hasown = Object.prototype.hasOwnProperty;
    var requestAnimationFrame = nx.global.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

    nx.path(nx.global, "nx.util.paint", function(painter) {
        var resources = new nx.Object();
        var callback = function() {
            var now = nx.date.now();
            resources.release("recursive");
            resources.retain("recursive", painter(now));
            id = requestAnimationFrame(callback);
        };
        var id = requestAnimationFrame(callback);
        resources.retain({
            release: function() {
                cancelAnimationFrame(id);
                resources.release("recursive");
            }
        });
        return resources;
    });

    nx.path(nx.global, "nx.util.paint.animate", (function() {

        var Runtime, Animation;
        var painting, map, runtimes;
        map = new nx.Map();
        runtimes = new nx.List();

        map.monitor(function(target, runtime) {
            runtime.start(nx.date.now());
        });

        runtimes.monitorContaining(function(runtime) {
            var target = runtime.animation().target();
            if (!map.get(target)) {
                map.set(target, runtime);
            }
            return function() {
                if (runtime === map.get(target)) {
                    var next = runtimes.find(function(item) {
                        return item.animation().target() === target;
                    });
                    if (next) {
                        map.set(target, next);
                    } else {
                        map.remove(target);
                    }
                }
            };
        });

        runtimes.watch("length", function(pname, length) {
            if (length) {
                painting = painting || nx.util.paint(function() {
                    var now = nx.date.now();
                    var map = new nx.Map();
                    nx.each(runtimes, function(runtime, index) {
                        var rate;
                        if (runtime.start()) {
                            rate = runtime.getRate(now);
                            if (runtime.draw(rate)) {
                                runtime.stop(now);
                                runtime.end(now);
                                runtime.release();
                            }
                        }
                    });
                });
            } else {
                painting && painting.release();
            }
        });

        Runtime = nx.define({
            properties: {
                animation: null,
                start: 0,
                stop: 0,
                end: 0,
                duration: 0,
                timingFunction: "linear",
                iterationCount: 1,
                direction: "normal" // "alternate"
            },
            methods: {
                init: function(options) {
                    this.inherited();
                    nx.sets(this, options);
                },
                getRate: function(now) {
                    now = now || nx.date.now();
                    var func, timingFunction = this.timingFunction() || nx.identity;
                    switch (timingFunction) {
                        case "linear":
                            func = nx.identity;
                            break;
                        case "ease":
                            // TODO etc.
                            break;
                    }
                    return Math.max(func((now - this.start()) / this.duration()), 0);
                },
                draw: function(rate) {
                    rate = rate >= 0 ? rate : this.getRate();
                    var target = this.animation().target();
                    var state0 = this.animation().state0();
                    var state1 = this.animation().state1();
                    var direction = this.direction();
                    var iterationCount = this.iterationCount();
                    var completed = false;
                    if (iterationCount === "infinite") {
                        rate = rate - Math.floor(rate);
                    } else {
                        if (rate > iterationCount) {
                            rate = 1;
                            completed = true;
                        }
                    }
                    if (direction === "alternate") {
                        rate = 1 - rate;
                    }
                    nx.each(state1, function(v1, path) {
                        var v, v0 = state0[path];
                        if (typeof v0 === "number") {
                            nx.path(target, path, v1 * rate + v0 * (1 - rate));
                        } else if (nx.is(v0, Array)) {
                            v = [];
                            nx.each(v0, function(value, idx) {
                                v[idx] = v1[idx] * rate + v0[idx] * (1 - rate);
                            });
                            nx.path(target, path, v);
                        } else {
			    // TODO more
			}
                    });
                    return completed;
                }
            }
        });

        Animation = nx.define({
            properties: {
                target: null,
                state0: {
                    value: function() {
                        return {};
                    }
                },
                state1: {
                    value: function() {
                        return {};
                    }
                }
            },
            methods: {
                init: function(target) {
                    this.inherited();
                    this.target(target);
                },
                reset: function() {
                    var target = this.target();
                    var state0 = this.state0();
                    var state1 = this.state1();
                    nx.each(state1, function(value, path) {
                        state0[path] = nx.path(target, path);
                    });
                },
                set: function(settings, prefix) {
                    prefix = prefix ? prefix + "." : "";
                    var target = this.target();
                    var state0 = this.state0();
                    var state1 = this.state1();
                    nx.each(settings, function(value, key) {
                        if (typeof key === "string") {
                            if (typeof value === "number") {
                                if (!hasown.call(state0, prefix + key)) {
                                    state0[prefix + key] = nx.path(target, prefix + key);
                                }
                                state1[prefix + key] = value;
                            } else if (nx.is(value, Array)) {
                                if (!hasown.call(state0, prefix + key)) {
                                    state0[prefix + key] = nx.path(target, prefix + key);
                                }
                                state1[prefix + key] = value;
                            } else {
                                this.set(value, prefix + key);
                            }
                        }
                    }.bind(this));
                },
                start: function(duration, timingFunction, iterationCount, direction) {
                    // variable-arguments
                    // default: 1000, "linear", 0, 1, "normal"
                    if (typeof duration === "number") {
                        if (timingFunction === "alternate" || timingFunction === "normal") {
                            direction = timingFunction;
                            iterationCount = 1;
                            timingFunction = "linear";
                        } else {
                            if (typeof timingFunction !== "string" && typeof timingFunction !== "function") {
                                direction = iterationCount;
                                iterationCount = timingFunction;
                                timingFunction = "linear";
                            }
                            if (typeof iterationCount !== "number" && isNaN(iterationCount * 1)) {
                                direction = iterationCount === "alternate" ? "alternate" : "normal";
                                iterationCount = 1;
                            } else {
                                iterationCount = iterationCount || 1;
                                direction = direction === "alternate" ? "alternate" : "normal";
                            }
                        }
                    } else {
                        duration = duration || {};
                        direction = duration.direction === "alternate" ? "alternate" : "normal";
                        iterationCount = duration.iterationCount || 1;
                        timingFunction = duration.timingFunction || "linear";
                        duration = duration.duration || 1000;
                    }
                    var runtime = new Runtime({
                        animation: this,
                        duration: duration,
                        timingFunction: timingFunction,
                        iterationCount: iterationCount,
                        direction: direction
                    });
                    runtime.retain({
                        release: function() {
                            runtime.stop(nx.date.now());
                            runtimes.remove(runtime);
                        }
                    });
                    runtimes.push(runtime);
                    return runtime;
                }
            }
        });

        return function(target, callback) {
            var animation = new Animation(target);
            callback(animation);
            return animation;
        };
    })());

})(nx);
(function () {
    nx.path(nx.global, "nx.util.ajax", (function () {
        var ajax = nx.global.$ ? $.ajax : (function () {
            // TODO
        })();
        return function (opts) {
            // TODO get real opts
            var options = nx.extend({}, opts);
            var resources = new nx.Object();
            // wrap returning functions
            options.success = function () {
                resources.release("abort");
                opts.success && nx.func.apply(opts.success, this, resources, arguments);
            };
            options.error = function () {
                resources.release("abort");
                opts.error && nx.func.apply(opts.error, this, resources, arguments);
            };
            options.complete = function () {
                resources.release("abort");
                opts.complete && nx.func.apply(opts.complete, this, resources, arguments);
            };
            // call ajax
            var xhr = ajax(options);
            // retain abort function
            resources.retain("abort", {
                release: function () {
                    xhr.abort();
                }
            });
            return resources;
        };
    })());
})(nx);
(function(nx) {
    nx.path(nx.global, "nx.util.ajaxs", (function() {
        var ajax = nx.util.ajax;
        var keysof = function(map) {
            var key, keys = [];
            if (map) {
                for (key in map) {
                    keys.push(key);
                }
            }
            return keys;
        };
        return function(options) {
            var resources = new nx.Object();
            var ajaxs = options.ajaxs;
            var key, total, count, keys, results, errorkey, errorval;
            results = {};
            count = 0;
            errorkey = null;
            keys = keysof(ajaxs);
            total = keys.length;
            var completed = function() {
                if (errorkey) {
                    options.error && options.error(errorkey, errorval);
                    options.complete && options.complete();
                } else {
                    options.success && options.success(results);
                    options.complete && options.complete();
                }
                // release all ajaxes
                nx.each(keys, function(key) {
                    resources.release(key);
                });
            };
	    // start all ajaxes
            nx.each(ajaxs || {}, function(value, key) {
                value = nx.extend({}, value);
                var complete = value.complete;
                var success = value.success;
                var error = value.error;
                value.success = function(result) {
                    success && nx.func.apply(success, arguments);
                    results[key] = result, count++;
                };
                value.error = function(result) {
                    nx.func.apply(error, arguments);
                    errorkey = key;
                    errorval = result;
                };
                value.complete = function() {
                    complete && nx.func.apply(complete, arguments);
                    if (errorkey || total <= count) {
                        completed && completed();
                    }
                };
                resources.retain("key", ajax(value));
            });
            return resources;
        };
    })());
})(nx);
(function (nx) {
    var square = nx.math.square;
    /**
     * @class MouseProcessor
     * @namespace nx.ui.capture
     */
    var EXPORT = nx.define("nx.ui.capture.MouseProcessor", {
        properties: {
            msHold: 400,
            event: {},
            track: {},
            handler: {}
        },
        methods: {
            enable: function (target) {
                var instance = this;
                target.addEventListener("mousedown", function (evt) {
                    instance.attach(evt);
                }, true);
                target.addEventListener("mousemove", function (evt) {
                    instance.move(evt);
                }, true);
                target.addEventListener("mouseup", function (evt) {
                    instance.end(evt);
                }, true);
                target.addEventListener("mousedown", function (evt) {
                    instance.detach(evt);
                });
            },
            attach: function (evt) {
                this.handler(null);
                this.event(evt);
                if (evt.capture) {
                    this._lastCapture = evt.capture;
                }
                evt.capture = this.capture.bind(this);
            },
            detach: function (evt) {
                if (this._lastCapture) {
                    evt.capture = this._lastCapture;
                    delete this._lastCapture;
                } else {
                    delete evt.capture;
                }
            },
            capture: function (handler) {
                // make sure only one handler can capture the "drag" event
                var captured, evt = this.event();
                if (handler && evt && evt.button === 0 && !this.handler()) {
                    this.handler(handler);
                    // track and data
                    var track = [];
                    this.track(track);
                    this.track().push([evt.clientX, evt.clientY]);
                    this._timer = setTimeout(this.hold.bind(this), this.msHold());
                    return true;
                }
                return false;
            },
            hold: function () {
                var handler = this.handler();
                var evt = this.event();
                if (this.isTrackLong()) {
                    if (!evt.capturedata) {
                        evt.capturedata = this._makeDragData(evt);
                    }
                    this._call(handler, "capturehold", evt);
                }
                clearTimeout(this._timer);
            },
            move: function (evt) {
                var handler = this.handler();
                if (handler) {
                    // TODO drag start event
                    // append point to the event
                    evt.capturedata = this._makeDragData(evt);
                    // fire events
                    this._call(handler, "capturedrag", evt);
                }
            },
            end: function (evt) {
                var handler = this.handler();
                if (handler) {
                    // append to the event
                    evt.capturedata = this._makeDragData(evt);
                    // fire events
                    this._call(handler, "capturedragend", evt);
                    if (this.isTrackLong()) {
                        this._call(handler, "capturetap", evt);
                    }
                    this._call(handler, "captureend", evt);
                }
                // clear status
                this.handler(null);
                this.track(null);
                this.event(null);
                clearTimeout(this._timer);
            },
            cancel: function () {
                // TODO cancel logic
            },
            isTrackLong: function () {
                var track = this.track();
                if (!track) {
                    return false;
                }
                var origin = track[0];
                return nx.each(track, function (position) {
                    if (square(position[0] - origin[0]) + square(position[1] - origin[1]) > 3 * 3) {
                        return false;
                    }
                });
            },
            _call: function (handler, name, evt) {
                if (handler[name] && typeof handler[name] === "function") {
                    var callback = handler[name].call(handler);
                    if (callback && typeof callback === "function") {
                        return callback(evt);
                    }
                } else if (nx.is(handler, nx.ui.Element)) {
                    handler.fire(name, evt);
                }
            },
            _makeDragData: function (evt) {
                var track = this.track();
                var current = [evt.clientX, evt.clientY],
                    origin = track[0],
                    last = track[track.length - 1];
                current.time = evt.timeStamp;
                track.push(current);
                if (!origin) {
                    origin = last = current.slice();
                }
                // TODO make sure the data is correct when target applied a matrix
                return {
                    target: this.handler(),
                    origin: origin,
                    position: current,
                    offset: [current[0] - origin[0], current[1] - origin[1]],
                    delta: [current[0] - last[0], current[1] - last[1]],
                    // TODO make it readonly
                    track: track
                };
            }
        }
    });
})(nx);
(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class Matcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.Matcher", {
        properties: {
            processor: null
        },
        methods: {
            init: function (processor) {
                this.inherited();
                this.processor(processor);
            },
            match: function (session) {
                return false;
            },
            affect: nx.idle
        }
    });
})(nx);
(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class ClearMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.ClearMatcher", nx.ui.capture.touch.Matcher, {
        properties: {
            timer: null
        },
        methods: {
            match: function (session) {
                return session.count() === 0;
            },
            affect: function (session) {
                var self = this;
                var processor = this.processor();
                return processor.trigger("captureend", session.lastEvent(), 0, function () {
                    processor.reset();
                });
            }
        }
    });
})(nx);
(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class TapMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.TapMatcher", nx.ui.capture.touch.Matcher, {
        methods: {
            match: function (session) {
                // only touch start happened
                return session.count() === 0 && session.timeline().length === 2 && session.timeline()[1].type === "touchend";
            },
            affect: function (session) {
                var processor = this.processor();
                var evt = session.lastEvent();
                evt.capturedata = {
                    position: session.touches()[0].track[0]
                };
                processor.trigger("capturetap", evt);
            }
        }
    });
})(nx);
(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class HoldMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.HoldMatcher", nx.ui.capture.touch.Matcher, {
        methods: {
            match: function (session) {
                // only touch start happened
                return session.timeline().length === 1;
            },
            affect: function (session) {
                var self = this;
                var processor = this.processor();
                var evt = session.lastEvent();
                evt.capturedata = {
                    position: session.touches()[0].track[0]
                };
                return processor.trigger("capturehold", session.lastEvent(), processor.msHold());
            }
        }
    });
})(nx);
(function (nx) {
    var Vector = nx.geometry.Vector;
    var Rectangle = nx.geometry.Rectangle;
    var GeoMath = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class DragMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.DragMatcher", nx.ui.capture.touch.Matcher, {
        properties: {
            touch: null,
            origin: null,
            ending: false
        },
        methods: {
            match: function (session) {
                if (EXPORT.isOneTouch(session)) {
                    if (this.touch()) {
                        return true;
                    }
                    var touch = EXPORT.getTouch(session);
                    this.touch(touch);
                    this.origin(touch.track.length - 1);
                    return false;
                } else {
                    if (this.touch()) {
                        this.ending(true);
                        return true;
                    }
                    return false;
                }
            },
            affect: function (session) {
                var processor = this.processor();
                var ename = this.ending() ? "capturedragend" : "capturedrag";
                var event = session.lastEvent();
                event.capturedata = this.makeZoomData(this.touch().track);
                processor.trigger(ename, event);
                if (this.ending()) {
                    this.touch(null);
                    this.ending(false);
                }
            },
            makeZoomData: function (track) {
                var origin = track[this.origin()];
                var target = track[track.length - 1];
                var previous = track[Math.max(this.origin(), track.length - 2)];
                return {
                    position: target.slice(),
                    origin: origin.slice(),
                    previous: previous.slice(),
                    delta: [target[0] - previous[0], target[1] - previous[1]],
                    offset: [target[0] - origin[0], target[1] - origin[1]],
                    track: track.slice(this.origin())
                };
            }
        },
        statics: {
            isOneTouch: function (session) {
                return session.count() === 1;
            },
            getTouch: function (session) {
                var i, touch, touches = session.touches();
                for (i = 0; i < touches.length; i++) {
                    touch = touches[i];
                    if (!touch.released) {
                        return touch;
                    }
                }
            },
            getTrack: function (session) {
                var i, touch, touches = session.touches();
                for (i = 0; i < touches.length; i++) {
                    touch = touches[i];
                    if (!touch.released) {
                        return touch.track;
                    }
                }
            }
        }
    });
})(nx);
(function(nx) {
    var Vector = nx.geometry.Vector;
    var Rectangle = nx.geometry.Rectangle;
    var GeoMath = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class TransformMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.TransformMatcher", nx.ui.capture.touch.Matcher, {
        properties: {
            origin: null,
            previous: null
        },
        methods: {
            match: function(session) {
                if (EXPORT.isTwoTouch(session)) {
                    if (this.origin()) {
                        return true;
                    }
                    var rect = EXPORT.getRect(session);
                    this.origin(rect);
                    this.previous(rect);
                    return false;
                } else {
                    return false;
                }
            },
            affect: function(session) {
                var processor = this.processor();
                var event = session.lastEvent();
                event.capturedata = this.makeZoomData(session);
                processor.trigger("capturetransform", event);
                this.previous(EXPORT.getRect(session));
                return {
                    release: function() {
                        var session = this.processor().session();
                        if (!EXPORT.isTwoTouch(session)) {
                            this.origin(null);
                            this.previous(null);
                        }
                    }.bind(this)
                };
            },
            makeZoomData: function(session) {
                var origin = this.origin();
                var previous = this.previous();
                var target = EXPORT.getRect(session);
                var p0 = [(origin[0][0] + origin[1][0]) / 2, (origin[0][1] + origin[1][1]) / 2];
                var pa = [(previous[0][0] + previous[1][0]) / 2, (previous[0][1] + previous[1][1]) / 2];
                var pb = [(target[0][0] + target[1][0]) / 2, (target[0][1] + target[1][1]) / 2];
                return {
                    delta: {
                        origin: pa,
                        target: pb,
                        translate: [pb[0] - pa[0], pb[1] - pa[1]],
                        scale: EXPORT.distance(target) / EXPORT.distance(previous),
                        rotate: EXPORT.angle(target) / EXPORT.angle(previous)
                    },
                    offset: {
                        origin: p0,
                        target: pb,
                        translate: [pb[0] - p0[0], pb[1] - p0[1]],
                        scale: EXPORT.distance(target) / EXPORT.distance(origin),
                        rotate: EXPORT.angle(target) / EXPORT.angle(origin)
                    }
                };
            }
        },
        statics: {
            isTwoTouch: function(session) {
                return session.count() === 2;
            },
            getRect: function(session) {
                var rect = [];
                nx.each(session.touches(), function(touch) {
                    if (!touch.released) {
                        rect.push(touch.track[touch.track.length - 1]);
                    }
                });
                // return
                return rect;
            },
            distance: function(rect) {
                var p0 = rect[0];
                var p1 = rect[1];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                return Math.sqrt(dx * dx + dy * dy);
            },
            angle: function(rect) {
                var p0 = rect[0];
                var p1 = rect[1];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                return Math.atan(dy, dx);
            }
        }
    });
})(nx);
(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class Session
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.Session", {
        properties: {
            // options
            precisionTime: 200,
            precisionDelta: 5,
            // store
            lastEvent: null,
            // calculation
            count: 0,
            indices: {
                value: function () {
                    return {};
                }
            },
            touches: {
                value: function () {
                    return [];
                }
            },
            timeline: {
                value: function () {
                    return [];
                }
            }
        },
        methods: {
            update: function (evt) {
                var time = evt.timeStamp,
                    changed = false;
                EXPORT.eachTouch(evt, function (touch) {
                    var id = touch.identifier;
                    var position = [touch.clientX, touch.clientY];
                    var ename = evt.type;
                    // FIXME treat touch cancel as touch end
                    ename = (ename === "touchcancel" ? "touchend" : ename);
                    // log the event
                    if (this[ename]) {
                        if (this[ename].call(this, time, id, position) !== false) {
                            changed = true;
                        }
                    }
                }.bind(this));
                if (changed) {
                    this.lastEvent(evt);
                    this.fire("update");
                }
            },
            touchstart: function (time, id, position) {
                // get the touch
                var index, indices = this.indices();
                var touch, touches = this.touches();
                index = indices[id] = touches.length;
                touch = touches[index] = {
                    id: id,
                    index: touches.length,
                    track: [position]
                };
                // increase the count
                this.count(this.count() + 1);
                // update timeline
                var timepiece, timeline = this.timeline();
                if (timeline.length === 1 && Math.approximate(timeline[0].time, time, this.precisionTime())) {
                    timepiece = timeline[0];
                } else {
                    timeline.push(timepiece = {
                        time: time,
                        type: "touchstart",
                        touches: []
                    });
                }
                // update the touches of time piece
                timepiece.touches[index] = touch;
            },
            touchmove: function (time, id, position) {
                // get the touch
                var index, indices = this.indices();
                var touch, touches = this.touches();
                index = indices[id];
                touch = touches[index];
                // ignore for to close touch move
                if (Vector.approximate(touch.track[touch.track.length - 1], position, this.precisionDelta())) {
                    return false;
                }
                touch.track.push(position);
                // update timeline
                var timepiece, timeline = this.timeline();
                timepiece = timeline[timeline.length - 1];
                if (timepiece.type !== "touchmove" || !Math.approximate(timepiece.time, time)) {
                    timeline.push(timepiece = {
                        time: time,
                        type: "touchmove",
                        touches: []
                    });
                }
                // update the touches of time piece
                timepiece.touches[index] = touch;
            },
            touchend: function (time, id) {
                // get the touch
                var index, indices = this.indices();
                var touch, touches = this.touches();
                index = indices[id];
                touch = touches[index];
                // clear
                indices[id] = undefined;
                touch.released = true;
                // increase the count
                this.count(this.count() - 1);
                // update timeline
                var timepiece, timeline = this.timeline();
                timepiece = timeline[timeline.length - 1];
                if (timepiece.type !== "touchend" || !Math.approximate(timepiece.time, time)) {
                    timeline.push(timepiece = {
                        time: time,
                        type: "touchend",
                        touches: []
                    });
                }
                // update the touches of time piece
                timepiece.touches[index] = touch;
            }
        },
        statics: {
            eachTouch: function (evt, callback) {
                var i, n = evt.changedTouches.length;
                for (i = 0; i < n; i++) {
                    if (callback(evt.changedTouches[i], i) === false) {
                        break;
                    }
                }
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * Touch events:
     * touchsessionstart (first touch point)
     * touchsessionzoom (touch 2 point and move)
     * touchsessionhover (touch and keep)
     * touchsessionopen (double tap)
     * touchsessionend (last touch point and no more in a while)
     *
     * @class TouchProcessor
     * @namespace nx.ui.capture
     */
    var EXPORT = nx.define("nx.ui.capture.TouchProcessor", {
        properties: {
            msDouble: 200,
            msHold: 400, // milliseconds of keeping touched
            event: {},
            handlers: {},
            matchers: {
                value: function () {
                    return [
                        new nx.ui.capture.touch.HoldMatcher(this), // matcher of hold event
                        new nx.ui.capture.touch.TapMatcher(this), // matcher of tap event
                        new nx.ui.capture.touch.DragMatcher(this), // matcher of dragging
                        new nx.ui.capture.touch.TransformMatcher(this), // matcher of zooming
                        new nx.ui.capture.touch.ClearMatcher(this) // default matcher of release
                    ];
                }
            },
            session: {
                watcher: function (pname, pvalue, poldvalue) {
                    this.release("session");
                    if (pvalue) {
                        this.retain("session", pvalue.on("update", this.updateSession.bind(this)));
                    }
                }
            }
        },
        methods: {
            enable: function (target) {
                var instance = this;
                target.addEventListener("touchstart", function (evt) {
                    instance.attach(evt);
                }, true);
                target.addEventListener("touchstart", function (evt) {
                    instance.detach(evt);
                });
                target.addEventListener("touchmove", function (evt) {
                    instance.update(evt);
                }, true);
                target.addEventListener("touchend", function (evt) {
                    instance.update(evt);
                }, true);
                target.addEventListener("touchcancel", function (evt) {
                    instance.update(evt);
                }, true);
            },
            attach: function (evt) {
                this.event(evt);
                // add capture on event
                if (evt.capture) {
                    this._lastCapture = evt.capture;
                }
                evt.capture = this.capture.bind(this);
                // start new session if not exists
                if (!this.session()) {
                    this.session(new nx.ui.capture.touch.Session());
                }
            },
            detach: function (evt) {
                // clear capture from event
                if (this._lastCapture) {
                    evt.capture = this._lastCapture;
                    delete this._lastCapture;
                } else {
                    delete evt.capture;
                }
                // update session with event
                this.update(evt);
            },
            capture: function (handler, names) {
                var handlers = this.handlers();
                // initial handlers if not exists
                if (!handlers) {
                    handlers = {};
                    this.handlers(handlers);
                    this.event().preventDefault();
                }
                // make sure only one handler can capture the "drag" event
                var success = true;
                names = typeof names === "string" ? names.replace(/\s/g, "").split(",") : names;
                nx.each(names, function (name) {
                    if (name === "end") {
                        // capture end belongs to all handlers
                        handlers["captureend"] = handlers["captureend"] || [];
                        handlers["captureend"].push(handler);
                    } else {
                        name = "capture" + name;
                        if (handler && !handlers[name]) {
                            handlers[name] = handler;
                        }
                    }
                });
                return success;
            },
            update: function (evt) {
                // update session with event
                if (this.session()) {
                    this.session().update(evt);
                    if (this.handlers()) {
                        evt.preventDefault();
                    }
                }
            },
            reset: function () {
                this.handlers(null);
                this.session().release();
                this.session(null);
            },
            trigger: function (name, evt, delay, delayCallback) {
                // call the notifier
                if (delay) {
                    return nx.timer(delay, function () {
                        this.triggerAction(name, evt);
                        delayCallback && delayCallback();
                    }.bind(this));
                } else {
                    this.triggerAction(name, evt);
                    delayCallback && delayCallback();
                }
            },
            triggerAction: function (name, evt, callback) {
                var self = this;
                var handlers = this.handlers();
                if (name === "captureend") {
                    nx.each(handlers && handlers[name], function (handler) {
                        self.triggerOne(handler, name, evt);
                    });
                } else {
                    if (handlers && handlers[name]) {
                        // check the handler existance
                        self.triggerOne(handlers[name], name, evt);
                    }
                }
            },
            triggerOne: function (handler, name, evt) {
                handler.fire(name, evt);
            },
            updateSession: function () {
                var session = this.session();
                nx.each(this.matchers(), function (matcher) {
                    // release if any previous states occurs
                    matcher.release("affect");
                    // try match the session
                    if (matcher.match(session)) {
                        var result = matcher.affect(session);
                        if (result) {
                            matcher.retain("affect", result);
                        }
                        if (result === false) {
                            return false;
                        }
                    }
                });
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class CaptureManager
     * @namespace nx.ui.capture
     */
    var EXPORT = nx.define("nx.ui.capture.CaptureManager", {
        properties: {
            mouseProcessor: {
                value: function () {
                    return new nx.ui.capture.MouseProcessor();
                }
            },
            touchProcessor: {
                value: function () {
                    return new nx.ui.capture.TouchProcessor();
                }
            }
        },
        methods: {
            enable: function (target) {
                // preprocess target
                if (!target) {
                    target = document;
                } else if (target.resolve) {
                    target = target._dom;
                }
                // enable mouse and touch input capture processors
                this.mouseProcessor().enable(target);
                this.touchProcessor().enable(target);
            }
        },
        statics: {
            offsetTooClose: function (offset) {
                return Math.abs(offset[0]) < 5 && Math.abs(offset[1]) < 5;
            },
            fixRect: function (rect) {
                if (!rect) {
                    return rect;
                }
                rect = nx.clone(rect);
                if (rect.width < 0) {
                    rect.left += rect.width;
                    rect.width = -rect.width;
                }
                if (rect.height < 0) {
                    rect.top += rect.height;
                    rect.height = -rect.height;
                }
                return rect;
            }
        }
    });

    nx.ready(function () {
        var instance = new EXPORT();
        instance.enable();
    });
})(nx);
(function(nx) {

    var global = nx.global;

    var Hierarchical = nx.Hierarchical;
    var cssclass = nx.util.cssclass;
    var cssstyle = nx.util.cssstyle;

    var EXPORT = nx.define("nx.ui.Element", nx.Hierarchical, {
        properties: {
            xmlns: {
                set: function() {
                    throw new Error("Unable to set xmlns of Element.");
                }
            },
            dom: {
                set: function() {
                    throw new Error("Unable to set dom of Element.");
                },
                watcher: function(name, value) {
                    this.release("syncDomEvents");
                    if (nx.is(value, Element)) {
                        this.retain("syncDomEvents", this._sync_dom_events(value));
                    }
                }
            },
            childDefaultType: "nx.ui.Element",
            hierarchicalSyncDom: nx.binding("childList", function(childList) {
                this.release("hierarchicalSyncDom");
                nx.is(childList, nx.List) && this.retain("hierarchicalSyncDom", this._sync_child_list(childList));
            })
        },
        hierarchical: {
            capture: function(meta, context) {
                return this.hierarchicalUpdateCapture(meta, context);
            },
            cssclass: function(meta, context) {
                return this.hierarchicalUpdateClass(meta, context);
            },
            cssstyle: function(meta, context) {
                return this.hierarchicalUpdateStyles(meta, context);
            },
            attributes: function(meta, context) {
                return this.hierarchicalUpdateAttributes(meta, context);
            }
        },
        methods: {
            init: function(tag, xmlns) {
                this.inherited();
                this._xmlns = xmlns || "";
                if (tag instanceof Element) {
                    this._dom = tag;
                    // TODO init with existing DOM Element (important if SEO required)
                    this.notify("dom");
                } else {
                    // initialize xmlns and dom-element
                    if (xmlns) {
                        // TODO default tag for known namespaces and throw error for still missing tag
                        this._dom = document.createElementNS(xmlns, tag);
                    } else {
                        this._dom = document.createElement(tag || "nx-element");
                    }
                    this.notify("dom");
                    // handle the view
                    this.initView();
                }
                // fire ready event
                this.fire("ready");
            },
            initView: function() {
                var instance = this;
                var clazz = instance.constructor;
                // get views' definitions of the whole inheritance
                var view, views = [];
                do {
                    view = clazz.__meta__.view;
                    if (view) {
                        // TODO validate structure configuration
                        views.unshift(view);
                    }
                    clazz = clazz.__super__;
                } while (clazz && clazz !== nx.ui.Element);
                // initialize the element in order
                nx.each(views, function(view) {
                    instance.retain(instance.hierarchicalUpdate(view, instance));
                });
            },
            append: function(child) {
                // TODO to be decided: use append or appendChildren
                return this.hierarchicalAppend(child, this);
            },
            appendTo: function(parent) {
                if (nx.is(parent, EXPORT)) {
                    return parent.append(this);
                }
                var dom = this.dom();
                if (!parent || parent === global || parent === document) {
                    parent = document.body;
                }
                // attach the the parent
                if (parent instanceof Element) {
                    this.parent(parent);
                    parent.appendChild(dom);
                    return {
                        release: function() {
                            this.parent(null);
                            parent.removeChild(dom);
                        }.bind(this)
                    };
                }
            },
            hasAttribute: function(name) {
                return this._dom.hasAttribute(name);
            },
            hasAttributeNS: function(xmlns, name) {
                return this._dom.hasAttributeNS(xmlns, name);
            },
            getAttribute: function(name) {
                return this._dom.getAttribute(name);
            },
            getAttributeNS: function(xmlns, name) {
                return this._dom.getAttributeNS(xmlns, name);
            },
            setAttribute: function(name, value) {
                return this._dom.setAttribute(name, value);
            },
            setAttributeNS: function(xmlns, name, value) {
                return this._dom.setAttributeNS(xmlns, name, value);
            },
            removeAttribute: function(name) {
                return this._dom.removeAttribute(name);
            },
            removeAttributeNS: function(xmlns, name) {
                return this._dom.removeAttributeNS(xmlns, name);
            },
            hasClass: function(name) {
                return cssclass.has(this._dom, name);
            },
            addClass: function(name) {
                return cssclass.add(this._dom, name);
            },
            removeClass: function(name) {
                return cssclass.remove(this._dom, name);
            },
            toggleClass: function(name, existance) {
                if (arguments.length > 1) {
                    return cssclass.toggle(this._dom, name, existance);
                } else {
                    return cssclass.toggle(this._dom, name);
                }
            },
            getComputedStyle: function(name) {
                // TODO browser prefix?
                return this._dom.getComputedStyle(name);
            },
            hasStyle: function(name) {
                // FIXME not good implementation
                return this._dom.style.cssText.indexOf(name + ":") >= 0;
            },
            getStyle: function(name) {
                return cssstyle.get(this._dom, name);
            },
            setStyle: function(name, value) {
                return cssstyle.set(this._dom, name, value);
            },
            removeStyle: function(name) {
                return cssstyle.remove(this._dom, name);
            },
            getBound: function() {
                return cssstyle.getBound(this._dom);
            },
            _sync_dom_events: function(dom) {
                var self = this;
                var supported = nx.util.event.supported(dom);
                var resources = new nx.Object();
                nx.each(supported, function(ename) {
                    var callback = function(evt) {
                        self.fire(ename, evt);
                    };
                    resources.retain(this.on("+" + ename, function() {
                        dom.addEventListener(ename, callback);
                    }));
                    resources.retain(this.on("-" + ename, function() {
                        dom.removeEventListener(ename, callback);
                    }));
                }, this);
                nx.each(supported, function(ename) {
                    var callback = function(evt) {
                        self.fire(":" + ename, evt);
                    };
                    resources.retain(this.on("+:" + ename, function() {
                        dom.addEventListener(ename, callback, true);
                    }));
                    resources.retain(this.on("-:" + ename, function() {
                        dom.removeEventListener(ename, callback, true);
                    }));
                }, this);
                return resources;
            },
            _sync_child_list: function(list) {
                // sync with the new child list
                return list.monitorDiff(function(evt) {
                    // TODO async for possible movings
                    var i, j, diff, diffs = evt.diffs;
                    var drop, drops = evt.drops;
                    var sibling, join, joins = evt.joins;
                    var node, dom, pdom = this._dom;
                    for (i = 0; i < diffs.length; i++) {
                        diff = diffs[i], drop = drops[i], join = joins[i];
                        switch (diff[0]) {
                            case "splice":
                                // remove if droping
                                for (j = 0; j < drop.length; j++) {
                                    node = drop[j];
                                    if (!node) {
                                        continue;
                                    }
                                    dom = (node instanceof Node) ? node : node._dom;
                                    if (dom instanceof Node) {
                                        pdom.removeChild(dom);
                                    }
                                }
                                // add if joining
                                sibling = pdom.childNodes[diff[1]];
                                for (j = 0; j < join.length; j++) {
                                    // get the DOM node to insert
                                    node = join[j];
                                    if (!node) {
                                        continue;
                                    }
                                    dom = (node instanceof Node) ? node : node._dom;
                                    // apply insert
                                    if (dom instanceof Node) {
                                        sibling ? pdom.insertBefore(dom, sibling) : pdom.appendChild(dom);
                                    }
                                }
                                break;
                            case "move":
                                if (diff[3] > 0) {
                                    // move forward
                                    sibling = pdom.childNodes[diff[1] + diff[2] + diff[3]];
                                    for (j = diff[2] - 1; j >= 0; j--) {
                                        dom = pdom.childNodes[diff[1] + j];
                                        sibling ? pdom.insertBefore(dom, sibling) : pdom.appendChild(dom);
                                        sibling = dom;
                                    }
                                } else {
                                    sibling = pdom.childNodes[diff[1] + diff[3]] || pdom.firstChild;
                                    for (j = diff[2] - 1; j >= 0; j--) {
                                        dom = pdom.childNodes[diff[1] + j];
                                        sibling ? pdom.insertBefore(dom, sibling) : pdom.appendChild(dom);
                                        sibling = dom;
                                    }
                                }
                                break;
                        }
                    }
                }, this);
            },
            hierarchicalAppend: function(meta, context, list) {
                if (meta instanceof Node) {
                    return this.hierarchicalAppendChildren([meta], context, list);
                }
                return this.inherited(meta, context, list);
            },
            hierarchicalAppendString: function(meta, context, list) {
                var resources = this.inherited(meta, context, list);
                if (resources === nx.Object.IDLE_RESOURCE) {
                    return this.hierarchicalAppendHtml(meta, context, list);
                }
                return resources;
            },
            hierarchicalAppendNumber: function(meta, context, list) {
                return this.hierarchicalAppendHtml(meta, context, list);
            },
            hierarchicalAppendHtml: function(html, context, list) {
                var self = this;
                context = context || self;
                // FIXME create element for HTML, etc.
                var container = document.createElement("div");
                container.innerHTML = html;
                var children = Array.prototype.slice.call(container.childNodes);
                return self.hierarchicalAppendChildren(children, context, list);
            },
            hierarchicalUpdateEvent: function(name, handler, context) {
                // preprocess capture
                if (name === "capture") {
                    return this.hierarchicalUpdateCapture(handler, context);
                }
                return this.inherited(name, handler, context);
            },
            hierarchicalUpdateCapture: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                // preprocess meta
                meta = Hierarchical.getBindingIfString(meta) || meta;
                // bind or listen on event
                if (nx.is(meta, nx.binding)) {
                    resources.retain(nx.Object.binding(context, meta, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateCapture(pvalue, context));
                    }));
                } else if (nx.is(meta, nx.Object)) {
                    resources.retain(this.hierarchicalUpdateCaptureObject(meta, context));
                } else {
                    var starter, events = [];
                    nx.each(meta, function(handler, name) {
                        if (name === "start") {
                            starter = handler;
                        } else {
                            events.push(name);
                            name = name.split(" ").map(function(name) {
                                return "capture" + name;
                            }).join(" ");
                            resources.retain(self.hierarchicalUpdateEvent(name, handler, context));
                        }
                    });
                    if (events.length) {
                        events = events.join(" ").split(" ");
                        resources.retain(self.hierarchicalUpdateEvent("mousedown touchstart", function(sender, evt) {
                            evt.capture(sender, events);
                            if (starter) {
                                if (typeof starter === "string") {
                                    // FIXME how about binding
                                    while (starter.charAt(0) === "{" && starter.charAt(starter.length - 1) === "}") {
                                        starter = starter.substring(1, starter.length - 1);
                                    }
                                    nx.path(context, starter).call(context, sender, evt);
                                } else {
                                    starter.call(context, sender, evt);
                                }
                            }
                        }, context));
                    }
                }
                return resources;
            },
            hierarchicalUpdateCaptureObject: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                var captures = new nx.List();
                nx.each(EXPORT.CAPTURES, function(name) {
                    var handler = meta[name];
                    if (!handler || typeof handler !== "function") {
                        return;
                    }
                    if (handler.__type__ === "property") {
                        resources.retain(name + "-watch", meta.watch(name, function(name, handler) {
                            if (typeof handler === "function") {
                                resources.retain(name, self.hierarchicalUpdateEvent("capture" + name, handler.bind(meta), context));
                                captures.toggle(name, true);
                            } else {
                                resources.release(name);
                                captures.toggle(name, false);
                            }
                        }));
                    } else {
                        resources.retain(name, self.hierarchicalUpdateEvent("capture" + name, handler.bind(meta), context));
                        captures.toggle(name, true);
                    }
                });
                resources.retain(captures.watch("length", function(pname, length) {
                    if (length) {
                        resources.retain("start", self.hierarchicalUpdateEvent("mousedown touchstart", function(sender, evt) {
                            evt.capture(sender, captures.toArray());
                            var starter = nx.path(meta, "start");
                            starter && starter.call(context, sender, evt);
                        }, context));
                    } else {
                        resources.release("start");
                    }
                }));
                return resources;
            },
            hierarchicalUpdateAttributes: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                // set attributes and properties of "child"
                nx.each(meta, function(value, key) {
                    if (key === "class") {
                        resources.retain(self.hierarchicalUpdateClass(value, context));
                    } else if (key === "style") {
                        resources.retain(self.hierarchicalUpdateStyles(value, context));
                    } else {
                        resources.retain(self.hierarchicalUpdateAttribute(key, value, context));
                    }
                });
                return resources;
            },
            hierarchicalUpdateAttribute: function(key, value, context) {
                var self = this;
                context = context || self;
                // parse "{xxx}"
                value = Hierarchical.getBindingIfString(value) || value;
                if (nx.is(value, nx.binding)) {
                    var resources = new nx.Object();
                    resources.retain(nx.Object.binding(context, value, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateAttribute(key, pvalue, context));
                    }));
                    return resources;
                } else {
                    if (value || value === 0 || value === "") {
                        self.setAttribute(key, value);
                    } else {
                        self.removeAttribute(key);
                    }
                    return nx.Object.IDLE_RESOURCE;
                }
            },
            hierarchicalUpdateClass: function(value, context) {
                var self = this;
                context = context || self;
                // FIXME for deep recursive, return release instead of update resource manager
                if (nx.is(value, nx.binding)) {
                    return self.hierarchicalUpdateClassBinding(value, context);
                } else {
                    var resources = new nx.Object();
                    if (nx.is(value, "String")) {
                        nx.each(value.split(" "), function(value) {
                            var binding = Hierarchical.getStringBindingByString(value);
                            if (binding) {
                                resources.retain(self.hierarchicalUpdateClassBinding(binding, context));
                            } else {
                                resources.retain(self.hierarchicalUpdateClassValue(value, context));
                            }
                        });
                    } else if (nx.is(value, "Array")) {
                        nx.each(value, function(value) {
                            resources.retain(self.hierarchicalUpdateClass(value, context));
                        });
                    }
                    return resources;
                }
            },
            hierarchicalUpdateClassValue: function(value, context) {
                var self = this;
                context = context || self;
                value && self.addClass(value);
                return {
                    release: function() {
                        value && self.removeClass(value);
                        value = null;
                    }
                };
            },
            hierarchicalUpdateClassBinding: function(value, context) {
                var self = this;
                context = context || self;
                var dom = self.dom();
                var resources = new nx.Object();;
                resources.retain(nx.Object.binding(context, value, function(pvalue) {
                    resources.release("recursive");
                    pvalue && resources.retain("recursive", self.hierarchicalUpdateClass(pvalue, context));
                }));
                return resources;
            },
            hierarchicalUpdateStyles: function(value, context) {
                var self = this;
                // parse "{xxx}"
                value = Hierarchical.getBindingIfString(value) || value;
                var resources;
                if (nx.is(value, nx.binding)) {
                    // as binding
                    resources = new nx.Object();
                    resources.retain(nx.Object.binding(context, value, function(pvalue) {
                        resources.release("recursive");
                        pvalue && resources.retain("recursive", self.hierarchicalUpdateStyles(pvalue, context));
                    }));
                } else if (typeof value === "string") {
                    // TODO plain css text
                    resources = nx.Object.IDLE_RESOURCE;
                } else {
                    resources = new nx.Object();
                    nx.each(value, function(value, key) {
                        resources.retain(self.hierarchicalUpdateStyle(key, value, context));
                    });
                }
                return resources;
            },
            hierarchicalUpdateStyle: function(key, value, context) {
                var self = this;
                context = context || self;
                // parse "{xxx}"
                value = Hierarchical.getBindingIfString(value) || value;
                // apply binding or value
                if (nx.is(value, nx.binding)) {
                    return self.hierarchicalUpdateStyleBinding(key, value, context);
                } else {
                    return self.hierarchicalUpdateStyleValue(key, value, context);
                }
            },
            hierarchicalUpdateStyleValue: function(key, value, context) {
                var self = this;
                context = context || self;
                var lastvalue = self.hasStyle(key) ? self.getStyle(key) : null;
                self.setStyle(key, value);
                return {
                    release: function() {
                        if (lastvalue) {
                            self.setStyle(key, lastvalue);
                        } else {
                            self.removeStyle(key);
                        }
                    }
                };
            },
            hierarchicalUpdateStyleBinding: function(key, value, context) {
                var self = this;
                context = context || self;
                var resources = new nx.Object();
                resources.retain(nx.Object.binding(context, value, function(pvalue) {
                    resources.release("recursive");
                    resources.retain("recursive", self.hierarchicalUpdateStyle(key, pvalue, context));
                }));
                return resources;
            }
        },
        statics: {
            CAPTURES: ["tap", "dragstart", "drag", "dragend", "transform", "hold", "end"],
            CSS: nx.util.csssheet.create({
                "nx-element": {
                    "display": "block"
                }
            })
        }
    });
})(nx);
(function (nx) {

    var Element = nx.ui.Element;

    var EXPORT = nx.define("nx.ui.Template", {
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
                        resource.retain("recursive", self.applyTemplate(parent, list, binding, pattern, context));
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
                        return list;
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
                                var view = Element.create(parent, meta);
                                Element.extendProperty(view, "scope", self);
                                view.retain(Element.update(view, meta, view));
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
(function(nx) {
    /**
     * @class Image
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Image", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("img");
            }
        },
        statics: {
            load: function(url, callback) {
                var resources = new nx.Object();
                var img = document.createElement("img");
                img.onload = function() {
                    callback && callback({
                        success: true,
                        image: img,
                        size: {
                            width: img.width,
                            height: img.height
                        }
                    });
                };
                img.onerror = function() {
                    callback && callback({
                        success: false,
                        image: img
                    });
                };
                img.src = url;
                resources.retain({
                    release: function() {
                        img = callback = null;
                    }
                });
                return resources;
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Form
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Form", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("form");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Label
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Label", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("label");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class HyperLink
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.HyperLink", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("a");
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class Select
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Select", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("select");
            },
            focus: function() {
                return this.dom().focus();
            },
            blur: function() {
                return this.dom().blur();
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class SelectOption
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.SelectOption", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("option");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Input", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("input");
            },
            focus: function () {
                return this.dom().focus();
            },
            blur: function () {
                return this.dom().blur();
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class InputFile
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputFile", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "file"
            },
            events: {
                change: function (sender, evt) {
                    // FIXME Chrome: it will not catch "reset" event of form
                    this.value(this.dom().value);
                }
            }
        },
        properties: {
            value: ""
        }
    });
})(nx);
(function (nx) {
    /**
     * @class InputCheckBox
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputCheckBox", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "checkbox"
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class InputRadio
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputRadio", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "radio"
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class InputButton
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputButton", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "button"
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class InputHidden
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputHidden", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "hidden"
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class TextArea
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TextArea", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("textarea");
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class TableHeadCell
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TableHeadCell", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("th");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TableCell", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("td");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TableRow", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("tr");
            }
        },
        properties: {
            childDefaultType: {
                value: function () {
                    return nx.ui.tag.TableCell;
                }
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Table", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("table");
            }
        },
        properties: {
            childDefaultType: {
                value: function () {
                    return nx.ui.tag.TableRow;
                }
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Span
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Span", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("span");
            }
        }
    });
})(nx);
(function (nx) {

    var EXPORT = nx.define("nx.ui.tag.Canvas", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("canvas");
            }
        }
    });
})(nx);
(function (nx) {

    var EXPORT = nx.define("nx.ui.tag.Source", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("source");
            }
        }
    });
})(nx);
(function (nx) {

    var EXPORT = nx.define("nx.ui.tag.Audio", nx.ui.Element, {
        view: {
            content: {
                repeat: "sources",
                type: "nx.ui.tag.Source",
                attributes: {
                    src: nx.binding("scope.model.src"),
                    type: nx.binding("scope.model.type")
                }
            }
        },
        properties: {
            sources: {}
        },
        methods: {
            init: function () {
                this.inherited("audio");
            },
            play: function () {
                this.dom().play();
            },
            pause: function () {
                this.dom().pause();
            }
        }
    });
})(nx);
(function (nx) {

    var EXPORT = nx.define("nx.ui.tag.Video", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("video");
            },
	    play: function(){
		this.dom().play();
	    },
	    pause: function(){
		this.dom().pause();
	    }
	}
    });
})(nx);
(function (nx) {
    /**
     * @class HorizontalRule
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.HorizontalRule", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("hr");
            }
        }
    });
})(nx);
(function(nx) {
    var EXPORT = nx.define("nx.lib.DefaultApplication", nx.ui.Element, {
        properties: {
            size: {
                watcher: function(pname, size) {
                    this.release("size");
                    if (size) {
                        this.retain("size", nx.ready(function() {
                            var fsize = this.getGlobalFontSizeByPageSize(size);
                            if (fsize) {
                                nx.util.cssstyle.set(document.documentElement, "font-size", fsize + "px");
                                this.setStyle("font-size", fsize + "px");
                            } else {
                                nx.util.cssstyle.remove(document.documentElement, "font-size");
                                this.removeStyle("font-size");
                            }
                        }.bind(this)));
                    }
                }
            }
        },
        methods: {
            init: function() {
                this.inherited("nx-app");
                this.retain(this.syncViewScale());
                if (!EXPORT.CSS_GLOBAL) {
                    EXPORT.CSS_GLOBAL = nx.util.csssheet.create({
                        "html": {
                            "height": "100%"
                        },
                        "body": {
                            "margin": "0",
                            "padding": "0",
                            "height": "100%",
                            "color": "#b3b3b3",
                            "font-family": "'Roboto'",
                            "user-select": "none"
                        }
                    });
                }
            },
            syncViewScale: function() {
                var self = this;
                var listener = function(evt) {
                    self.size({
                        width: global.innerWidth,
                        height: global.innerHeight
                    });
                };
                global.addEventListener("resize", listener);
                this.size({
                    width: global.innerWidth,
                    height: global.innerHeight
                });
                return {
                    release: function() {
                        global.removeEventListener("resize", listener);
                    }
                };
            },
            getGlobalFontSizeByPageSize: function(size) {
                return 0;
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class Thread
     * @namespace nx.lib.thread
     */
    var EXPORT = nx.define("nx.lib.thread.Thread", {
        properties: {
            worker: null
        },
        methods: {
            init: function(src) {
                this.inherited();
                // TODO leak?
                var worker = this.worker(new Worker(src));
                worker.onmessage = function(evt) {
                    this.fire("message", evt.data);
                }.bind(this);
            },
            send: function(message) {
                this.worker().postMessage(message);
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.AbstractNode", nx.ui.Element, {
        properties: {
            childDefaultType: {
                value: function () {
                    return nx.lib.svg.Node;
                }
            },
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: null,
            // Drawing properties
            /**
             * @property fill
             * @type {String/Number}
             */
            fill: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.setStyle("fill", pvalue);
                    } else {
                        this.removeStyle("fill");
                    }
                }
            },
            /**
             * @property fillComputed
             * @type {Number}
             * @readOnly
             */
            fillComputed: {
                dependencies: "fill,parentNode.strokeComputed",
                value: function (v, pv) {
                    return (v && v != "inherit") ? v : (pv || "black");
                }
            },
            /**
             * @property stroke
             * @type {String/Number}
             */
            stroke: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.setStyle("stroke", pvalue);
                    } else {
                        this.removeStyle("stroke");
                    }
                }
            },
            /**
             * @property strokeComputed
             * @type {Number}
             * @readOnly
             */
            strokeComputed: {
                dependencies: "stroke,parentNode.strokeComputed",
                value: function (v, pv) {
                    return (v && v != "inherit") ? v : (pv || "black");
                }
            },
            /**
             * @property strokeWidth
             * @type {String/Number}
             */
            strokeWidth: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.setStyle("stroke-width", pvalue);
                    } else {
                        this.removeStyle("stroke-width");
                    }
                }
            },
            /**
             * @property strokeWidthComputed
             * @type {Number}
             * @readOnly
             */
            strokeWidthComputed: {
                dependencies: "strokeWidth,parentNode.strokeWidthComputed",
                value: function (v, pv) {
                    return (v >= 0) ? v : (pv || 0);
                }
            }
        },
        methods: {
            hierarchy: function () {
                var rslt = [this],
                    node = this.parentNode();
                while (node) {
                    rslt.unshift(node);
                    node = node.parentNode();
                }
                return rslt;
            }
        },
        statics: {
            cssTransformMatrix: function (matrix) {
                if (!matrix) {
                    // no transform for no matrix
                    return "";
                }
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class SvgDefs
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.SvgDefs", nx.lib.svg.AbstractNode, {
        methods: {
            init: function () {
                this.inherited("defs", nx.lib.svg.Svg.DEFAULT_XML_NAMESPACE);
            }
        },
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                dependencies: "parentNode.graph"
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class SvgStyle
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.SvgStyle", nx.lib.svg.AbstractNode, {
        methods: {
            init: function() {
                this.inherited("style", nx.lib.svg.Svg.DEFAULT_XML_NAMESPACE);
            }
        },
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                dependencies: "parentNode.graph"
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class Canvas
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.Svg", nx.lib.svg.AbstractNode, {
        view: {
            content: {
                name: "defs",
                type: "nx.lib.svg.SvgDefs"
            }
        },
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                value: function() {
                    return this;
                }
            },
            /**
             * @property naturalTerminal
             * @type {Boolean}
             */
            naturalTerminal: {
                value: false
            }
        },
        methods: {
            init: function() {
                this.inherited("svg", "http://www.w3.org/2000/svg");
            },
            getWidth: function() {
                return this.$dom.offsetWidth;
            },
            getHeight: function() {
                return this.$dom.offsetHeight;
            },
            serialize: function(toDataUrl) {
                return EXPORT.serialize(this.dom(), toDataUrl);
            }
        },
        statics: {
            DEFAULT_XML_NAMESPACE: "http://www.w3.org/2000/svg",
            getSvgSize: function(svg) {
                var width = svg.getAttribute("width");
                var height = svg.getAttribute("height");
                var vb = svg.getAttribute("viewBox");
                if (width) {
                    width = width.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (height) {
                    height = height.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (vb) {
                    vb = vb.split(" ");
                    width = width || vb[2] * 1 || 0;
                    height = height || vb[3] * 1 || 0;
                }
                return {
                    width: width || 0,
                    height: height || 0
                };
            },
            serialize: function(dom, toDataUrl) {
                var serializer = new XMLSerializer();
                var serialized = serializer.serializeToString(dom);
                if (toDataUrl !== false) {
                    return "data:image/svg+xml;utf8," + serialized;
                } else {
                    return serialized;
                }
            }
        }
    });
    nx.util.csssheet.create({
        // FIXME I used to add 'stroke:black;fill:transparent' here, but I forgot why
        "svg text": {
            "user-select": "none"
        }
    });
})(nx);
(function(nx) {
    var geometry = nx.geometry;
    /**
     * @class Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.Node", nx.lib.svg.AbstractNode, {
        mixins: [nx.geometry.MatrixSupport],
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                dependencies: "parentNode.graph"
            },
            /**
             * @property cssTransform
             * @type {String}
             * @readOnly
             */
            cssTransform: {
                dependencies: "matrix",
                value: function(matrix) {
                    if (matrix) {
                        return EXPORT.cssTransformMatrix(matrix);
                    }
                },
                watcher: function(pname, pvalue) {
                    if (pvalue) {
                        if (pvalue != "matrix(1,0,0,1,0,0)" || this.hasStyle("transform")) {
                            this.setStyle("transform", pvalue);
                        }
                    }
                }
            },
            naturalTerminal: {
                value: false
            },
            /**
             * @property naturalMatrix
             * @type {Number[3][3]}
             */
            naturalMatrix: {
                dependencies: "parentNode.naturalTerminal, parentNode.naturalMatrix, matrix",
                value: function(term, pm, m, cause) {
                    if (term && cause.indexOf("parentNode.") == 0) {
                        return;
                    }
                    if (pm && m) {
                        this.naturalMatrix(geometry.Matrix.multiply(m, pm));
                    } else if (m) {
                        this.naturalMatrix(m || pm || geometry.Matrix.I);
                    }
                }
            },
            /**
             * @property naturalMatrix_internal_
             * @type {Number[3][3]}
             */
            naturalMatrix_internal_: {
                dependencies: "naturalMatrix",
                value: function(m) {
                    return m && new geometry.Matrix(m);
                }
            },
            /**
             * @property naturalPosition
             * @type {Number[2]}
             * @readOnly
             */
            naturalPosition: {
                dependencies: "naturalMatrix",
                value: function(m) {
                    return (m && [m[2][0], m[2][1]]) || [0, 0];
                }
            },
            /**
             * @property naturalRotate
             * @type {Number}
             * @readOnly
             */
            naturalRotate: {
                dependencies: "naturalMatrix_internal_.rotate"
            },
            /**
             * @property naturalScale
             * @type {Number}
             * @readOnly
             */
            naturalScale: {
                dependencies: "naturalMatrix_internal_.scale"
            }
        },
        methods: {
            init: function(tag) {
                this.inherited(tag || "g", nx.lib.svg.Svg.DEFAULT_XML_NAMESPACE);
            },
            applyNatureTranslate: function(x, y) {
                var parent = this.parentNode();
                var transmatrix = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [x, y, 1]
                ];
                this.matrix(geometry.Matrix.multiply(this.naturalMatrix_internal_().getMatrixInversion(), transmatrix, this.naturalMatrix(), this.matrix()));
            }
        },
        statics: {
            cssTransformMatrix: function(matrix) {
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class Use
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.Use", nx.lib.svg.Node, {
        properties: {
            href: {
                watcher: function(pname, pvalue) {
                    if (pvalue) {
                        this.setAttributeNS("http://www.w3.org/1999/xlink", "href", pvalue);
                    }
                }
            }
        },
        methods: {
            init: function() {
                this.inherited("use");
            }
        }
    });
})(nx);
(function(nx) {
    /**
     * @class Use
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Image", nx.lib.svg.Node, {
        properties: {
            href: {
                watcher: function(pname, pvalue) {
                    if (pvalue) {
                        this.setAttributeNS("http://www.w3.org/1999/xlink", "href", pvalue);
                    }
                }
            }
        },
        methods: {
            init: function(tag) {
                this.inherited("image");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Rectangle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Text", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("text");
            }
        },
        view: {
            properties: {
                class: "text"
            }
        },
        properties: {
            text: {
                value: "",
                watcher: function (pname, pvalue) {
                    this.release("text");
                    this.retain("text", this.append(pvalue));
                }
            },
            textAnchor: {
                value: "middle",
                watcher: function (pname, pvalue) {
                    this.setAttribute("text-anchor", pvalue);
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                "svg text": {
                    "stroke": "none"
                }
            })
        }
    });
})(nx);
(function (nx) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Line", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("line");
            }
        }
    });
})(nx);
(function (nx) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.LineAsVector", nx.lib.svg.Node, {
        view: {
            attributes: {
                x1: "0",
                y1: "0"
            }
        },
        properties: {
            /**
             * @property dx
             * @type {Number}
             */
            dx: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (!pvalue && pvalue !== 0) {
                        pvalue = "";
                    }
                    this.setAttribute("x2", pvalue);
                }
            },
            /**
             * @property dy
             * @type {Number}
             */
            dy: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (!pvalue && pvalue !== 0) {
                        pvalue = "";
                    }
                    this.setAttribute("y2", pvalue);
                }
            }
        },
        methods: {
            init: function () {
                this.inherited("line");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Rectangle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Rectangle", nx.lib.svg.Node, {
        properties: {
            /**
             * @property center
             * @type {Boolean}
             */
            center: {
                value: false
            },
            /**
             * @property width
             * @type {Number}
             */
            width: {
                value: 0
            },
            /**
             * @property height
             * @type {Number}
             */
            height: {
                value: 0
            },
            /**
             * @property bound_internal_
             * @type {Number[4]}
             * @private
             */
            bound_internal_: {
                dependencies: "center, width, height",
                value: function (center, width, height) {
                    var x, y, w, h;
                    w = Math.abs(width);
                    h = Math.abs(height);
                    if (center) {
                        x = -w / 2;
                        y = -h / 2;
                    } else {
                        x = (width < 0 ? width : 0);
                        y = (height < 0 ? height : 0);
                    }
                    return [x, y, w, h];
                },
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        nx.each(["x", "y", "width", "height"], function (attr, idx) {
                            if (pvalue[idx]) {
                                this.setAttribute(attr, pvalue[idx]);
                            } else {
                                this.removeAttribute(attr);
                            }
                        }.bind(this));
                    }
                }
            },
            /**
             * @property rx
             * @type {Number}
             */
            rx: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this.setAttribute("rx", pvalue);
                    } else {
                        this.removeAttribute("rx");
                    }
                }
            },
            /**
             * @property ry
             * @type {Number}
             */
            ry: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this.setAttribute("ry", pvalue);
                    } else {
                        this.removeAttribute("ry");
                    }
                }
            }
        },
        methods: {
            init: function () {
                this.inherited("rect");
            }
        }
    });
})(nx);
(function (nx) {

    /**
     * @class Polygon
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Polygon", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("polygon");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Circle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Circle", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("circle");
            }
        }
    });
})(nx);
(function (nx) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Path", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("path");
            }
        },
        properties: {
            vectors: {
                value: []
            },
            d: {
                dependencies: "vectors",
                value: function (vectors) {
                    if (vectors && vectors.length) {
                        var v0, v1, rslt = "M 0 0";
                        do {
                            v = vectors.shift();
                            rslt += " l " + v[0] + " " + v[1];
                        } while (vectors.length);
                        return rslt;
                    }
                    return this._d || "M 0 0";
                },
                watcher: function (pname, pvalue) {
                    this.setAttribute("d", pvalue);
                }
            }
        }
    });
})(nx);
(function (nx) {
    var EXPORT = nx.define("nx.lib.svg.shape.PathGroup", nx.lib.svg.Node, {
        view: {
            content: nx.template({
                source: "data",
                pattern: {
                    type: "nx.lib.svg.shape.Path",
                    properties: {
                        d: nx.binding("scope.model.d"),
                        fill: nx.binding("scope.model.fill"),
                        stroke: nx.binding("scope.model.stroke")
                    }
                }
            })
        },
        properties: {
            data: {}
        }
    });
})(nx);
(function (nx) {

    var Vector = nx.geometry.Vector;
    var multiply = Vector.multiply;
    var rotate = Vector.rotate;
    var length = Vector.abs;
    var plus = Vector.plus;
    var golden = Math.sqrt(5) / 2 - .5;

    /**
     * @class Rectangle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.PathLine", nx.lib.svg.shape.Path, {
        properties: {
            operationsUpdater_internal_: {
                dependencies: "dx, dy, dh",
                async: true,
                value: function (property, dx, dy, dh) {
                    if (!dh) {
                        this.vectors([
                            [dx, dy]
                        ]);
                    } else {
                        var v0 = [dx, dy],
                            vd = rotate(length([dx, dy], dh), Math.PI / 2),
                            pt = plus(multiply(v0, .5), vd);
                        var d = "M 0 0";
                        d += " " + ["C"].concat(plus(multiply(vd, golden), multiply(v0, 1 / 6))).concat(plus(vd, multiply(v0, 1 / 3))).concat(pt).join(" ");
                        d += " " + ["C"].concat(plus(vd, multiply(v0, 2 / 3))).concat(plus(multiply(vd, golden), multiply(v0, 5 / 6))).concat(v0).join(" ");
                        this.d(d);
                    }
                }
            },
            /**
             * @property dx
             * @type {Number}
             */
            dx: {
                value: 100
            },
            /**
             * @property dy
             * @type {Number}
             */
            dy: {
                value: 0
            },
            /**
             * @property dh
             * @type {Number}
             */
            dh: {
                value: 0
            }
        }
    });
})(nx);
(function(nx) {

    // short cuts of functions

    var geometry = nx.geometry;
    var Vector = geometry.Vector;
    var rotate = Vector.rotate;
    var length = Vector.abs;
    var multiply = Vector.multiply;
    var plus = Vector.plus;
    var vect = function(v, l, a) {
        v = multiply(v, l);
        if (a) {
            v = rotate(v, a);
        }
        return v;
    };

    var PI = Math.PI;
    var abs = Math.abs,
        sin = geometry.Math.sin,
        cos = geometry.Math.cos,
        tan = geometry.Math.tan,
        cot = geometry.Math.cot;
    var D90 = PI / 2;

    /**
     * @class Arrow
     * @extends nx.lib.svg.PathLine
     * @namespace nx.lib.svg.shape
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Arrow", nx.lib.svg.shape.PathLine, {
        view: {
            cssclass: "arrow"
        },
        properties: {
            stroke: {
                watcher: function(pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.setAttribute("fill", pvalue);
                    }
                }
            },
            strokeWidth: {
                value: "inherit",
                watcher: nx.idle
            },
            fill: {
                watcher: nx.idle
            },
            operationsUpdater_internal_: {
                dependencies: "strokeWidthComputed,dx,dy,dh,sharpness,concavity",
                async: true,
                value: function(async, strokeWidthComputed, dx, dy, dh, sharpness, concavity) {
                    var all_numbers = ([strokeWidthComputed, dx, dy, dh, sharpness, concavity].findIndex(function(v) {
                        return !nx.is(v, "Number");
                    }) < 0);
                    if (!all_numbers || strokeWidthComputed == 0 || (dx == 0 && dy == 0)) {
                        return;
                    }
                    var vectors = [];
                    // update the sharpness and concavity
                    concavity = concavity || PI;
                    // add vectors
                    var v = [dx, dy],
                        i = length(v, 1);
                    // prepare data
                    var len = length(v),
                        width = strokeWidthComputed;
                    var a = sharpness / 2,
                        b = concavity / 2,
                        w = width / 2;
                    var len0 = len - w * (cot(a) * 2 - cot(b));
                    // make sure the sharpness is reasonable and the arrow head won't take too much place
                    if (sharpness > 0 && sharpness <= PI && (w * 4 / len < tan(a))) {
                        // start create vectors
                        vectors.push(vect(i, w, D90));
                        vectors.push(vect(i, len0));
                        vectors.push(vect(i, w / sin(b), PI - b));
                        vectors.push(vect(i, width / sin(a), -a));
                        vectors.push(vect(i, width / sin(a), PI + a));
                        vectors.push(vect(i, w / sin(b), b));
                        vectors.push(vect(i, -len0));
                        vectors.push(vect(i, w, D90));
                    } else {
                        vectors.push(vect(i, w, D90));
                        vectors.push([dx, dy]);
                        vectors.push(vect(i, w * 2, -D90));
                        vectors.push([-dx, -dy]);
                        vectors.push(vect(i, w, D90));
                    }
                    this.vectors(vectors);
                }
            },
            /**
             * @property sharpnessDeg
             * @type {Number}
             */
            sharpnessDeg: {
                value: 30
            },
            /**
             * @property sharpness
             * @type {Number}
             */
            sharpness: {
                dependencies: "sharpnessDeg",
                value: function(deg) {
                    if (deg) {
                        return deg * PI / 180;
                    }
                    return PI / 6;
                }
            },
            /**
             * @property concavityDeg
             * @type {Number}
             */
            concavityDeg: {
                value: 0
            },
            /**
             * @property concavity
             * @type {Number}
             */
            concavity: {
                dependencies: "concavityDeg",
                value: function(deg) {
                    if (deg) {
                        return deg * PI / 180;
                    }
                    return PI;
                }
            }
        },
        methods: {
            init: function(options) {
                this.inherited(options);
                this.setAttribute("stroke-width", 0);
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class Filter
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.Filter", nx.lib.svg.AbstractNode, {
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                dependencies: "parentNode.graph"
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeBlend
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeBlend", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feBlend", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeColorMatrix
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeColorMatrix", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feColorMatrix", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeComponentTransfer
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeComponentTransfer", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feComponentTransfer", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeComposite
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeComposite", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feComposite", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeConvolveMatrix
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeConvolveMatrix", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feConvolveMatrix", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeDiffuseLighting
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeDiffuseLighting", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feDiffuseLighting", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeDisplacementMap
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeDisplacementMap", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feDisplacementMap", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeDistantLight
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeDistantLight", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feDistantLight", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeFlood
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeFlood", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feFlood", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeGaussianBlur
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeGaussianBlur", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feGaussianBlur", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeImage
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeImage", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feImage", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeMerge
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeMerge", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feMerge", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeMorphology
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeMorphology", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feMorphology", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeOffset
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeOffset", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feOffset", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FePointLight
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FePointLight", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("fePointLight", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeSpecularLighting
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeSpecularLighting", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feSpecularLighting", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeSpotLight
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeSpotLight", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feSpotLight", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeTile
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeTile", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feTile", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FeTurbulence
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeTurbulence", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feTurbulence", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
(function(nx) {
    var BOUND = 2;
    var DEFAULT_AXIS = "y";
    var EXPORT = nx.define("nx.lib.component.Scroller", nx.ui.Element, {
        view: {
            cssclass: "scroller",
            content: {
                name: "inner"
            },
            capture: {
                start: "handler_dragstart",
                drag: "handler_dragmove",
                dragend: "handler_dragend"
            },
            events: {
                axis: "option_axis"
            }
        },
        properties: {
            pageSize: 1, // not paging
            axis: DEFAULT_AXIS,
            elastic: 2000
        },
        methods: {
            init: function(options) {
                this.inherited();
                nx.sets(this, options);
                this._x = this._y = 0;
            },
            /**
             * Check if scroll is enabled on the given axis.
             */
            isScrollable: function(d) {
                var axis = this.axis() || DEFAULT_AXIS;
                if (arguments.length == 0) {
                    return axis == "x" || axis == "y";
                }
                return d == axis;
            },
            /**
             * Get the scroll limit on the given axis.
             */
            getLimit: function() {
                var axis = this.axis();
                var page, rslt = 0;
                rslt = Math.min(0, this._out[axis] - this._in[axis]);
                // extend the limit to fit paging
                page = this.pageSize();
                if (rslt && page > 1) {
                    rslt = Math.ceil(rslt / page) * page;
                }
                return rslt;
            },
            /**
             * Consider the inner content's current position, returning the real delta caused by the given mouse delta.
             */
            delta: function(delta) {
                if (!this.isScrollable()) {
                    return 0;
                }
                var axis = this.axis();
                var w = this.getLimit(axis);
                var x = this["_" + axis];
                if (x > 0) {
                    if (x * BOUND + delta > 0) {
                        return delta / BOUND;
                    } else if (x * 2 + delta < w) {
                        return (delta - w) / BOUND + w;
                    } else {
                        return x * BOUND + delta - x;
                    }
                } else if ((x - w) < 0) {
                    if ((x - w) * BOUND + delta < 0) {
                        return delta / BOUND;
                    } else if ((x - w) * BOUND + delta > -w) {
                        return (delta + w) / BOUND - w;
                    } else {
                        return delta - (BOUND - 1) * (w - x);
                    }
                } else {
                    if (x + delta > 0) {
                        return (delta - x) / 2;
                    } else if (x + delta < w) {
                        return (delta - x + w) / 2;
                    } else {
                        return delta;
                    }
                }
            },
            freemove: function(v) {
                if (!this.isScrollable()) {
                    return false;
                }
                var axis = this.axis();
                var self = this,
                    a, w, x0;
                var delta, time, bezier;
                var xt, v1, t1, t2, x, s;
                a = this.elastic();
                w = this.getLimit();
                x0 = this["_" + axis];
                if (x0 > 0 || x0 < w) {
                    // out of bound
                    delta = (x0 > 0 ? -x0 : w - x0);
                    time = Math.sqrt(Math.abs(delta * 2 / a / BOUND));
                    bezier = "(0.5, 1, 1, 1)";
                } else {
                    time = Math.abs(v / a);
                    delta = v * time / 2;
                    xt = x0 + delta;
                    if (xt <= 0 && xt >= w) {
                        bezier = "(0, 1, 1, 1)";
                    } else {
                        delta = (xt > 0 ? -x0 : w - x0);
                        v1 = (v >= 0 ? 1 : -1) * Math.sqrt(v * v - 2 * a * delta);
                        t1 = Math.abs((v - v1) / a);
                        t2 = Math.abs(v1 / BOUND / a);
                        time = t1 + t2 * 2;
                        x = v1 * t2 / 2;
                        s = delta + x * 2;
                        bezier = "(" + ((t1 + t2) / time) + "," + (s / delta) + "," + ((t1 + t2 * 1.5) / time) + ", 1)";
                    }
                }
                if (time > 1) {
                    time = 1;
                }
                this.animate(time, bezier);
                this["_" + axis] += delta;
                this.translate(this._x, this._y);
                setTimeout(function() {
                    var pg = self.pageSize() || 1;
                    var offset = self["_" + axis];
                    if (offset % pg) {
                        self["_" + axis] = Math.round(offset / pg) * pg;
                        self.animate(0.15, "(0.5, 1, 1, 1)");
                        self.translate(self._x, self._y);
                        setTimeout(function() {
                            self.animate(false);
                        }, 150);
                    } else {
                        self.animate(false);
                    }
                }, time * 1000 + 10);
            },
            option_axis: function() {
                this.reset();
            },
            /**
             * Refresh the current size of inner/outer panels.
             */
            update: function() {
                var inBound = this.inner().getBound();
                var outBound = this.getBound();
                this._in = {
                    x: inBound.width,
                    y: inBound.height
                };
                this._out = {
                    x: outBound.width,
                    y: outBound.height
                };
            },
            /**
             * Reset the scroll position.
             */
            reset: function() {
                this._x = 0;
                this._y = 0;
                this.translate(this._x, this._y);
            },
            fixbound: function() {
                this.update();
                this.freemove(0);
            },
            handler_dragstart: function(self, evt) {
                this.update();
                this.animate(false);
            },
            handler_dragmove: function(self, evt) {
                if (this.isScrollable()) {
                    // get delta
                    var axis = this.axis();
                    this["_" + axis] += this.delta(evt.capturedata.delta[axis == "x" ? 0 : 1]);
                    // do translation
                    this.translate(this._x, this._y);
                }
            },
            handler_dragend: function(self, evt) {
                if (this.isScrollable()) {
                    var v = EXPORT.getSpeed(evt.capturedata.track);
                    var axis = this.axis();
                    this.freemove(v[axis]);
                }
            },
            translate: function(x, y) {
                this.inner().setStyle("transform", "translate(" + x + "px, " + y + "px)");
                this.inner().setStyle("transform", "translate3d(" + x + "px, " + y + "px, 0)");
            },
            /**
             * The switch of animation, using Bezier curve timing function.
             */
            animate: function(seconds, bezier) {
                if (seconds === false) {
                    this.inner().removeStyle("transition-duration");
                    this.inner().removeStyle("transition-timing-function");
                } else {
                    var val = seconds + "s";
                    this.inner().setStyle({
                        "transition-duration": val,
                        "transition-timing-function": "cubic-bezier" + bezier
                    });
                }
            }
        },
        statics: {
            DEFAULT_AXIS: DEFAULT_AXIS,
            getSpeed: function(track) {
                // TODO better algorithm
                var v = {
                    x: (track[track.length - 1][0] - track[0][0]) * 1000 / Math.max(1, track[track.length - 1].time - track[0].time),
                    y: (track[track.length - 1][1] - track[0][1]) * 1000 / Math.max(1, track[track.length - 1].time - track[0].time)
                };
                if (Math.abs(track[track.length - 1][0] - track[0][0]) < 40) {
                    v.x = 0;
                } else if (Math.abs(v.x) < 1200) {
                    v.x = (v.x > 0 ? 1 : -1) * 1200;
                }
                if (Math.abs(track[track.length - 1][1] - track[0][1]) < 40) {
                    v.y = 0;
                } else if (Math.abs(v.y) < 1200) {
                    v.y = (v.y > 0 ? 1 : -1) * 1200;
                }
                if (track[track.length - 1].time - track[0].time > 300) {
                    v.x = v.y = 0;
                }
                return v;
            }
        }
    });
})(nx);
(function (nx) {
    /**
     * @class FileLabel
     * @extends nx.ui.tag.Label
     */
    var EXPORT = nx.define("nx.lib.component.FileLabel", nx.ui.tag.Label, {
        view: {
            attributes: {
                "for": nx.binding("name"),
                class: ["nx-file-label", nx.binding("disabled", function (disabled) {
                    return disabled ? "disabled" : false;
                })]
            },
            content: [{
                name: "input",
                type: "nx.ui.tag.InputFile",
                attributes: {
                    id: nx.binding("name"),
                    name: nx.binding("name"),
                    accept: nx.binding("accept"),
                    disabled: nx.binding("disabled", function (disabled) {
                        return disabled ? "disabled" : false;
                    })
                },
                events: {
                    change: function () {
                        this.fire("change", this.input().dom());
                    }
                }
            }]
        },
        properties: {
            name: "",
            accept: "",
            disabled: false
        }
    });
})(nx);
(function(nx) {
    var EXPORT = nx.define("nx.lib.component.NormalInput", nx.ui.Element, {
        view: {
            cssclass: "nx-normal-input",
            content: {
                name: "input",
                type: "nx.ui.tag.Input",
                attributes: {
                    value: nx.binding("value", true, function(setter, value) {
                        if (value !== this.input().dom().value) {
                            this.input().dom().value = value;
                        }
                    }),
                    id: nx.binding("id"),
                    name: nx.binding("name"),
                    placeholder: nx.binding("placeholder"),
                    readonly: nx.binding("readonly"),
                    type: nx.binding("password", function(password) {
                        return password ? "password" : "text";
                    })
                },
                events: {
                    input: function(sender, evt) {
                        // TODO better monitor
                        this.value(this.input().dom().value);
                        this.fire("input", evt);
                    }
                }
            }
        },
        properties: {
            id: null,
            value: null,
            name: null,
            placeholder: null,
            readonly: false,
            password: false
        },
        methods: {
            focus: function() {
                this.input().dom().focus();
            },
            blur: function() {
                this.input().dom().blur();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".nx-normal-input": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nx-normal-input > input": {
                    "position": "absolute",
                    "background": "transparent",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "line-height": "inherit",
                    "outline": "none",
                    "border": "0",
                    "border-radius": "inherit",
                    "text-indent": "inherit",
                    "font-family": "inherit",
                    "font-size": "inherit",
                    "font-weight": "inherit"
                }
            })
        }
    });
})(nx);
(function(nx) {
    var EXPORT = nx.define("nx.lib.component.NormalSelect", nx.ui.Element, {
        view: {
            cssclass: "nx-normal-select",
            content: {
                name: "select",
                type: "nx.ui.tag.Select",
                attributes: {
                    id: "{id}",
                    name: "{name}",
                    readonly: nx.binding("readonly")
                },
                content: {
                    repeat: "{options}",
                    type: "nx.ui.tag.SelectOption",
                    attributes: {
                        value: "{scope.model.value}",
                        selected: nx.binding("scope.context.value, scope.model.value", function(value, ovalue) {
                            if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                value = "" + value;
                            }
                            return value === ovalue && "selected";
                        })
                    },
                    content: "{scope.model.text}"
                }
            }
        },
        properties: {
            id: null,
            name: null,
            value: null,
            options: null,
            readonly: false
        },
        methods: {
            focus: function() {
                this.select().dom().focus();
            },
            blur: function() {
                this.select().dom().blur();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".nx-normal-select": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nx-normal-select > select": {
                    "position": "absolute",
                    "background": "transparent",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "outline": "none",
                    "border": "0",
                    "border-radius": "inherit",
                    "text-indent": "inherit",
                    "font-family": "inherit",
                    "font-size": "inherit",
                    "font-weight": "inherit"
                }
            })
        }
    });
})(nx);
(function (nx, position, dom, ui, global) {
    var DETECTTIMER = 10;
    var CLASS = nx.define("nx.lib.component.CommonContenteditable", nx.ui.Component, {
        events: ["common_contenteditable_change", "common_contenteditable_caret", "common_contenteditable_keydown"],
        properties: {
            textHTML: {
                get: function () {
                    return this.dom().innerHTML;
                }
            },
            textPlain: {
                get: function () {
                    return CLASS.dom.plainate(this.dom()).text;
                },
                set: function (value) {
                    value = value || "";
                    var node;
                    while (this.dom().firstChild) {
                        this.dom().removeChild(this.dom().firstChild);
                    }
                    node = document.createTextNode(value);
                    this.dom().appendChild(node);
                    this.notify("textPlain");
                    // reset caret
                    this._caret = {
                        node: node,
                        text: value,
                        offset: value ? value.length : 0
                    };
                    // notify event
                    this.fire("common_contenteditable_change");
                }
            },
            caret: {
                get: function () {
                    if (!this._caret) {
                        this._caret = {
                            node: this.dom(),
                            text: "",
                            offset: 0
                        };
                    }
                    return this._caret;
                }
            },
            captureKeyCodeList: {
                value: []
            }
        },
        view: {
            properties: {
                spellcheck: "false",
                tabindex: 0,
                contenteditable: "true"
            },
            events: {
                input: "{#_handle_input}",
                keydown: "{#_handle_keydown}",
                keypress: "{#_handle_keypress}",
                focus: "{#_handle_focus_on}",
                blur: "{#_handle_focus_off}",
                mouseup: "{#_handle_mouseup}",
                click: "{#_handle_click}"
            }
        },
        methods: {
            empty: function () {
                this.inherited(arguments);
                // reset caret
                this._caret = null;
                // notify event
                this.fire("common_contenteditable_change");
            },
            displace: function (options) {
                var parent = this.dom();
                var caret = this._caret || {
                    node: parent,
                    text: "",
                    offset: 0
                };
                var text, textnode, node, area, value = options.value;
                if (caret.node === parent) { // caret on the root element
                    if (caret.offset == parent.childNodes.length) { // caret at the end of root element
                        if (typeof value == "string") {
                            textnode = document.createTextNode(value);
                            parent.appendChild(textnode);
                            this.collapse(textnode, value.length);
                        } else if (CLASS.is.element(value)) {
                            value.setAttribute("contenteditable", "false");
                            // add the element
                            parent.appendChild(value);
                            this.collapse(parent, offset + 1);
                        }
                    } else { // caret before a node
                        node = parent.childNodes[caret.offset];
                        if (typeof value == "string") {
                            textnode = document.createTextNode(value);
                            parent.insertBefore(textnode, node);
                            this.collapse(textnode, value.length);
                        } else if (CLASS.is.element(value)) {
                            value.setAttribute("contenteditable", "false");
                            // add the element
                            parent.insertBefore(value, node);
                            this.collapse(parent, offset + 1);
                        }
                    }
                } else if (CLASS.is.text(caret.node)) { // caret on text node
                    // initialize displace area
                    area = options.deltaArea ? options.deltaArea.slice() : [0, 0];
                    area[0] += caret.offset;
                    area[1] += caret.offset;
                    // displace
                    if (typeof value == "string") {
                        text = caret.text.substring(0, area[0]) + value + caret.text.substring(area[1]);
                        caret.node.textContent = text;
                        // collapse the focus
                        this.collapse(caret.node, area[0] + value.length);
                    } else if (CLASS.is.element(value)) {
                        value.setAttribute("contenteditable", "false");
                        // add the element
                        text = caret.text;
                        if (area[0] > 0) {
                            parent.insertBefore(document.createTextNode(text.substring(0, area[0])), node);
                        } else if (CLASS.is.element(node.previousSibling)) {
                            parent.insertBefore(textnode = document.createTextNode(" "), node);
                        }
                        parent.insertBefore(value, node);
                        if (area[1] < text.length) {
                            textnode = document.createTextNode(text.substring(area[1]));
                            parent.insertBefore(textnode, node);
                            parent.removeChild(node);
                            // collapse the focus
                            this.collapse(textnode, 0);
                        } else {
                            textnode = document.createTextNode("\u200D");
                            parent.insertBefore(textnode, node);
                            parent.removeChild(node);
                            // collapse the focus
                            this.collapse(textnode, 0);
                        }
                    }
                }
                // trigger event
                CLASS.dom.purify(this.dom());
                this.fire("common_contenteditable_change");
            },
            detector: function (on) {
                if (on) {
                    // set a timer to check the caret position
                    if (!this._timer_detector) {
                        this._timer_detector = setInterval(function () {
                            if (this._lock_detector) {
                                // the content currently is not detectable
                                return;
                            }
                            this.updateCaret();
                        }.bind(this), DETECTTIMER);
                    }
                } else {
                    // clear the timer
                    if (this._timer_detector) {
                        clearInterval(this._timer_detector);
                        this._timer_detector = false;
                    }
                }
            },
            collapse: function (node, index) {
                window.getSelection().collapse(node, index);
                this.updateCaret();
            },
            updateCaret: function () {
                (function () {
                    if (nx.Env.browser().name == "firefox") {
                        // FIXME firefox bug
                        var selection = window.getSelection();
                        var focusNode = selection.isCollapsed && selection.focusNode;
                        var focusOffset = selection.isCollapsed && selection.focusOffset;
                        if (CLASS.is.text(focusNode) && focusNode === this.dom().lastChild) {
                            if (focusOffset == focusNode.textContent.length) {
                                if (/\s$/.test(focusNode.textContent)) {
                                    window.getSelection().collapse(focusNode, focusOffset - 1);
                                } else {
                                    focusNode.textContent += " ";
                                    window.getSelection().collapse(focusNode, focusOffset);
                                }
                            }
                        }
                    }
                }).call(this);
                var selection = window.getSelection().getRangeAt(0);
                var focusNode = selection.startContainer;
                var plain = CLASS.dom.plainate(focusNode);
                var node = this._caret && this._caret.node;
                var text = this._caret && this._caret.text;
                var offset = this._caret && this._caret.offset;
                var range = this._caret && this._caret.range;
                if (node === focusNode && offset === plain.offset && text === plain.text && range === plain.range) {
                    return;
                }
                this._caret = {
                    node: focusNode,
                    text: plain.text,
                    offset: plain.offset,
                    range: plain.range
                };
                this.fire("common_contenteditable_caret", {
                    node: focusNode,
                    text: plain.text,
                    offset: plain.offset,
                    range: plain.range
                });
            },
            _handle_input: function () {
                this._lock_detector = true;
                // wrap in a timeout: the caret moved AFTER the event "input" processed
                setTimeout(function () {
                    // update
                    CLASS.dom.purify(this.dom());
                    // trigger event
                    this.updateCaret();
                    this.fire("common_contenteditable_change");
                    // release the lock, let the detection be available
                    this._lock_detector = false;
                }.bind(this), 5);
            },
            _handle_focus_on: function () {
                this.detector(true);
            },
            _handle_focus_off: function () {
                this.detector(false);
            },
            _handle_keypress: function (sender, edata) {
                edata.stopPropagation();
            },
            _handle_keydown: function (sender, evt) {
                var link, node;
                var i, captureKeyCodeList = this.captureKeyCodeList();
                for (i = 0; i < captureKeyCodeList.length; i++) {
                    if (evt.which == captureKeyCodeList[i]) {
                        this.fire("common_contenteditable_keydown", evt);
                        break;
                    } else if (evt.which == 13) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        break;
                    }
                }
            },
            _handle_mouseup: function (sender, evt) {
                if (evt.target.tagName == "A" && evt.target.parentNode === this.dom()) {
                    window.getSelection().collapse(this.dom(), CLASS.dom.index(evt.target) + 1);
                }
            },
            _handle_click: function (sender, evt) {
                if (evt.target.tagName == "A" && evt.target.parentNode === this.dom()) {
                    evt.preventDefault();
                }
            }
        },
        statics: {
            is: {
                contain: function (parent, child) {
                    while (child.parentNode && child.parentNode !== child) {
                        if (parent === child.parendNode) {
                            return true;
                        }
                        child = child.parentNode;
                    }
                    return false;
                },
                text: function (node) {
                    // FIXME
                    return !!node && !node.tagName;
                },
                element: function (node) {
                    // FIXME
                    return !!node && !!node.tagName;
                }
            },
            dom: {
                index: function (el) {
                    var i = 0;
                    while (el.previousSibling) {
                        i++;
                        el = el.previousSibling;
                    }
                    return i;
                },
                plainate: function (parent) {
                    var sobj = window.getSelection();
                    var robj = sobj.rangeCount ? sobj.getRangeAt(0) : {};
                    var plainate = function (parent) {
                        var text = "", offset = -1, range = -1;
                        if (CLASS.is.text(parent)) {
                            text = parent.textContent;
                            if (robj.startContainer === parent) {
                                offset = robj.startOffset;
                                if (robj.endContainer === parent) {
                                    range = robj.endOffset - robj.startOffset;
                                }
                            }
                        } else if (CLASS.is.element(parent)) {
                            var i, node, plain, len = parent.childNodes.length;
                            for (i = 0; i < len; i++) {
                                node = parent.childNodes[i];
                                plain = plainate(node);
                                if (offset >= 0) {
                                    text += plain.text;
                                } else {
                                    if (plain.offset >= 0) {
                                        offset = text.length + plain.offset;
                                        range = plain.range;
                                    }
                                    text += plain.text;
                                }
                            }
                            if (robj.startContainer === parent) {
                                offset = text.length;
                                range = 0;
                            }
                        }
                        return {
                            text: text,
                            offset: offset,
                            range: range
                        };
                    }
                    var plain = plainate(parent);
                    // clear "\u200D"
                    var index;
                    while ((index = plain.text.indexOf("\u200D")) >= 0) {
                        if (index < plain.offset) {
                            plain.offset--;
                        }
                        plain.text = plain.text.substring(0, index) + plain.text.substring(index + 1);
                    }
                    return plain;
                },
                purify: function (parent) {
                    function mergeText (text1, text2) {
                        var selection = window.getSelection();
                        var focusNode = selection.isCollapsed && selection.focusNode;
                        var focusOffset = selection.isCollapsed && selection.focusOffset;
                        var caret = (focusNode === text1 ? focusOffset : (focusNode === text2 ? text1.textContent.length + focusOffset : -1));
                        text1.textContent = text1.textContent + text2.textContent;
                        if (caret >= 0) {
                            selection.collapse(text1, caret);
                        }
                    }
                    var i, children = [], len, node, text, plain, textnode;
                    len = parent.childNodes.length;
                    // purify elements
                    for (i = len - 1; i >= 0; i--) {
                        node = parent.childNodes[i];
                        if (CLASS.is.text(node)) {
                            continue;
                        }
                        if (CLASS.is.element(node)) {
                            plain = CLASS.dom.plainate(node);
                            if (node.tagName.toUpperCase() == "A" && node.getAttribute("href") && node.getAttribute("contenteditable") == "false") {
                                continue;
                            }
                            if (plain.text) {
                                // plainate all element into text nodes
                                textnode = document.createTextNode(plain.text);
                                parent.insertBefore(textnode, node);
                                if (plain.offset >= 0) {
                                    window.getSelection().collapse(textnode, plain.offset);
                                }
                            }
                        }
                        parent.removeChild(node);
                    }
                    // merge text nodes
                    len = parent.childNodes.length;
                    for (i = len - 1; i >= 0; i--) {
                        node = parent.childNodes[i];
                        if (CLASS.is.text(node)) {
                            plain = CLASS.dom.plainate(node);
                            if (plain.text) {
                                if (node.textContent !== plain.text) {
                                    node.textContent = plain.text;
                                }
                                if (plain.offset >= 0) {
                                    window.getSelection().collapse(node, plain.offset);
                                }
                                if (CLASS.is.text(node.nextSibling)) {
                                    mergeText(node, node.nextSibling);
                                    parent.removeChild(node.nextSibling);
                                }
                            } else {
                                parent.removeChild(node);
                                if (plain.offset >= 0) {
                                    window.getSelection().collapse(parent, i);
                                }
                            }
                        }
                    }
                    // give a default value
                    if (nx.Env.browser().name == "chrome") {
                        // fix chrome bug
                        var selection = window.getSelection();
                        var focusNode = selection.isCollapsed && selection.focusNode;
                        var focusOffset = selection.isCollapsed && selection.focusOffset;
                        if (focusNode === parent && CLASS.is.element(parent.lastChild) && focusOffset == parent.childNodes.length) {
                            node = document.createTextNode("\u200D");
                            parent.appendChild(node);
                            window.getSelection().collapse(parent, focusOffset);
                        }
                    } else if (nx.Env.browser().name == "firefox") {
                        node = document.createTextNode("\u200D");
                        parent.appendChild(node);
                    }
                }
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
(function (nx, position, dom, ui, global) {
    var CLASS = nx.define("nx.lib.component.AutoComplete", nx.ui.Element, {
        view: {
            attributes: {
                class: "position-parent"
            },
            content: [{
                name: "input",
                type: "nx.lib.component.CommonContenteditable",
                attributes: {
                    class: "input form-control",
                    tabindex: nx.binding("tabindex"),
                    contenteditable: nx.binding("contenteditable")
                },
                events: {
                    common_contenteditable_caret: "_handle_input_caret",
                    common_contenteditable_keydown: "_handle_input_keydown",
                    common_contenteditable_change: "_handle_input_change"
                }
            }, {
                name: "list",
                attributes: {
                    tabindex: 0,
                    class: ["list", nx.binding("listVisibilityClass_internal_")],
                    style: {
                        position: "absolute"
                    }
                },
                content: nx.binding("listItemTemplate", function (listItemTemplate) {
                    if (listItemTemplate) {
                        return nx.template({
                            source: "listData",
                            pattern: listItemTemplate
                        });
                    }
                })
            }]
        },
        properties: {
            value: {
                get: function () {
                    return this.input().textPlain();
                },
                set: function (value) {
                    this.input().textPlain(value);
                    this.notify("value");
                }
            },
            contenteditable: {
                value: true
            },
            tabindex: {
                value: -1
            },
            promptMode: {
                // caret, input, select
                value: "input"
            },
            inputCaret_internal_: {
                value: null
            },
            inputCaretReplaceInfo_internal_: {
                value: nx.binding({
                    context: true,
                    source: "promptMode, inputCaret_internal_",
                    callback: function (promptMode, inputCaret_internal_) {
                        if (!inputCaret_internal_ || inputCaret_internal_.offset < 0 || typeof inputCaret_internal_.text !== "string") {
                            return null;
                        }
                        var text = inputCaret_internal_.text,
                            offset = inputCaret_internal_.offset,
                            range = inputCaret_internal_.range;
                        if (range < 0 || range + offset > text.length) {
                            range = text.length - offset;
                        }
                        var target = null,
                            keyword;
                        var text0 = text.substring(0, offset);
                        var text1 = text.substring(offset, offset + range);
                        var text2 = text.substring(offset + range);
                        switch (promptMode) {
                        case "select":
                            target = {
                                keyword: text0,
                                deltaStart: -text0.length,
                                deltaEnd: text.length - text0.length
                            };
                            break;
                        case "caret":
                        case "input":
                        default:
                            if (!text2 || /^\s/.test(text2)) {
                                if (/^(.*\s)?([^\s]+)$/.test(text0)) {
                                    keyword = text0.replace(/^(.*\s)?([^\s]*)$/, "$2");
                                    target = {
                                        keyword: keyword,
                                        deltaStart: -keyword.length,
                                        deltaEnd: range
                                    };
                                }
                            }
                            break;
                        }
                        return target;
                    }
                })
            },
            inputFocus: {
                value: false
            },
            inputCaptureKeyCodeList_internal_: {
                value: [],
                value: nx.binding({
                    context: true,
                    source: "listVisibility_internal_",
                    callback: function (listVisibility_internal_) {
                        return listVisibility_internal_ ? CLASS.captureKeyCodeList : [];
                    }
                }),
                watcher: function () {
                    this.input().captureKeyCodeList(this.inputCaptureKeyCodeList_internal_());
                }
            },
            listData: {
                value: [],
                watcher: function () {
                    var list = this.list();
                    setTimeout(function () {
                        nxex.toolkit.collectionItemHandle(list.content(), function (collection, child) {
                            child.dom().addClass("item");
                            var handleMouseEnter, handleMouseLeave, handleClick;
                            handleMouseEnter = function () {
                                this.listItemActivated(child);
                            }.bind(this);
                            handleMouseLeave = function () {
                                this.listItemActivated(null);
                            }.bind(this);
                            handleClick = function () {
                                this._executeSelection(child.template().model());
                            }.bind(this);
                            child.on("mouseenter", handleMouseEnter);
                            child.on("mouseleave", handleMouseLeave);
                            child.on("click", handleClick);
                            return {
                                release: function () {
                                    child.off("mouseenter", handleMouseEnter);
                                    child.off("mouseleave", handleMouseLeave);
                                    child.off("click", handleClick);
                                }
                            };
                        }.bind(this)).notify();
                    }.bind(this), 1);
                }
            },
            listDataKeyPath: {
                value: ""
            },
            listDataFilter: {
                value: null
            },
            listDataSelector_internal_: {
                value: null,
                value: nx.binding({
                    context: true,
                    source: "listDataKeyPath,listDataFilter",
                    callback: function (listDataKeyPath, listDataFilter) {
                        if (listDataFilter) {
                            return listDataFilter;
                        }
                        return CLASS.selectorByPath(listDataKeyPath);
                    }
                })
            },
            listItemCountLimit: {
                value: 0
            },
            listDataSelected_internal_: {
                value: [],
                value: nx.binding({
                    context: true,
                    source: "inputCaretReplaceInfo_internal_,listData,listDataSelector_internal_,listItemCountLimit",
                    callback: function (inputCaretReplaceInfo_internal_, listData, listDataSelector_internal_, listItemCountLimit) {
                        if (!listDataSelector_internal_) {
                            return [];
                        }
                        var selected = listDataSelector_internal_.call(this, inputCaretReplaceInfo_internal_, listData);
                        if (selected && selected.length > 0 && listItemCountLimit > 0) {
                            selected = selected.slice(0, listItemCountLimit);
                        }
                        return selected;
                    }
                }),
                watcher: function () {
                    var list = this.list();
                    var selected = this.listDataSelected_internal_();
                    if (selected && selected.length) {
                        nx.each(list.content(), function (child) {
                            var i;
                            for (i = 0; i < selected.length; i++) {
                                if (child.template().model() === selected[i]) {
                                    break;
                                }
                            }
                            child.dom().setClass("hidden", i >= selected.length);
                        }.bind(this));
                    }
                }
            },
            listItemActivated: {
                value: -1,
                get: function () {
                    var i, child, children = this.list().content().toArray();
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        if (child.dom().hasClass("active")) {
                            return child;
                        }
                    }
                    return null;
                },
                set: function (value) {
                    var i, child, children = this.list().content().toArray();
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        if (value === child && !child.dom().hasClass("hidden")) {
                            child.dom().addClass("active");
                        } else {
                            child.dom().removeClass("active");
                        }
                    }
                },
                value: nx.binding({
                    context: true,
                    source: "listDataSelected_internal_",
                    callback: function (listDataSelected_internal_) {
                        // clear the activation if the item is hidden
                        var listItemActivated = this.listItemActivated();
                        if (!listItemActivated || !listItemActivated.dom().hasClass("hidden")) {
                            return null;
                        }
                        return listItemActivated;
                    }
                }),
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this._scrollTo(pvalue);
                    }
                }
            },
            listVisibility_internal_: {
                value: true,
                value: nx.binding({
                    context: true,
                    source: "inputFocus,listDataSelected_internal_",
                    callback: function (inputFocus, listDataSelected_internal_) {
                        if (listDataSelected_internal_ && listDataSelected_internal_.length) {
                            if (inputFocus) {
                                return true;
                            }
                        }
                        return false;
                    }
                }),
                watcher: function () {
                    var promptMode = this.promptMode();
                    CLASS.adjustListPosition(promptMode, this, this.list());
                }
            },
            listVisibilityClass_internal_: {
                value: nx.binding("listVisibility_internal_", function (b) {
                    return b ? "" : "hidden";
                })
            },
            listItemTemplate: {
                value: {
                    content: nx.binding("model")
                }
            },
            listDataSelectedItem: {
                value: null,
                value: nx.binding({
                    context: true,
                    source: "promptMode, listData, inputCaretReplaceInfo_internal_, listDataKeyPath",
                    callback: function (promptMode, listData, inputCaretReplaceInfo_internal_, listDataKeyPath) {
                        var result = this.listDataSelectedItem(),
                            value = this.value();
                        if (listData && inputCaretReplaceInfo_internal_) {
                            switch (promptMode) {
                            case "select":
                                var i, item, text, matches = [];
                                for (i = 0; listData && i < listData.length; i++) {
                                    item = listData[i];
                                    text = nx.path(item, listDataKeyPath);
                                    if ((text || "").toLowerCase() === (value || "").toLowerCase()) {
                                        matches.push(item);
                                    }
                                }
                                if (matches.length == 1) {
                                    result = matches[0];
                                } else {
                                    result = null;
                                }
                                break;
                            default:
                                break;
                            }
                        }
                        return result;
                    }
                }),
                watcher: function () {
                    this.fire("execute_selection", this.listDataSelectedItem());
                }
            }
        },
        methods: {
            init: function () {
                this.inherited();
                // handler the focus
                this.focusGroup = new nxex.common.FocusGroup();
                this.focusGroup.add(this.input());
                this.focusGroup.add(this.list());
                this.focusGroup.on("focus", this._handle_group_focus, this);
                this.focusGroup.on("blur", this._handle_group_blur, this);
            },
            clear: function () {
                this.input().empty();
                this.fire("execute_change");
            },
            _scrollTo: function (item) {
                var idx = this._getListItemIndex(item);
                var list = this.list();
                var ei = item.dom(),
                    el = list.dom();
                var bi = item.dom().getBound(),
                    bl = list.dom().getBound();
                var hi = ei.offsetHeight,
                    ti = bi.top,
                    hl = el.clientHeight,
                    tl = bl.top,
                    sl = el.scrollTop;
                if (ti + hi > tl + hl) {
                    el.scrollTop += (ti + hi) - (tl + hl);
                }
                if (ti < tl) {
                    el.scrollTop -= tl - ti;
                }
            },
            _executeSelection: function (model) {
                var info = this.inputCaretReplaceInfo_internal_();
                if (info) {
                    var path = this.listDataKeyPath();
                    var text = nx.path(model, path);
                    this.input().displace({
                        deltaArea: [info.deltaStart, info.deltaEnd],
                        value: text
                    });
                    this.listDataSelectedItem(model);
                }
            },
            _getListItemIndex: function (item) {
                var i, child, children = this.list().content().toArray();
                for (i = 0; i < children.length; i++) {
                    child = children[i];
                    if (child === item) {
                        return i;
                    }
                }
                return -1;
            },
            _getListItemRelative: function (item, relation) {
                var result = null;
                var i, children = this.list().content().toArray();
                switch (relation) {
                case "previous-visible":
                    i = this._getListItemIndex(item);
                    while (--i >= 0) {
                        if (!children[i].dom().hasClass("hidden")) {
                            result = children[i];
                            break;
                        }
                    }
                    break;
                case "next-visible":
                    i = this._getListItemIndex(item);
                    while (++i < children.length) {
                        if (!children[i].dom().hasClass("hidden")) {
                            result = children[i];
                            break;
                        }
                    }
                    break;
                case "first":
                case "last":
                case "first-visible":
                case "last-visible":
                case "previous":
                case "next":
                default:
                    // TODO
                    break;
                }
                return result;
            },
            _handle_focus: function () {
                this.input().dom().focus();
            },
            _handle_group_focus: function () {
                this.inputFocus(true);
                this.fire("focus");
            },
            _handle_group_blur: function () {
                this.inputFocus(false);
                this.fire("blur");
            },
            _handle_input_caret: function () {
                this.inputCaret_internal_(this.input().caret());
            },
            _handle_input_change: function () {
                this.inputCaret_internal_(this.input().caret());
                this.fire("execute_change");
            },
            _handle_input_keydown: function (sender, evt) {
                var i, item, items, idx;
                switch (evt.which) {
                case 13:
                    // ENTER
                    if (this.listVisibility_internal_()) {
                        evt.preventDefault();
                        item = this.listItemActivated();
                        if (!item) {
                            item = this._getListItemRelative(item, "next-visible");
                        }
                        if (item && item.model()) {
                            this._executeSelection(item.model());
                        }
                    }
                    break;
                case 38:
                    // UP
                    if (this.listVisibility_internal_()) {
                        evt.preventDefault();
                        item = this.listItemActivated();
                        item = this._getListItemRelative(item, "previous-visible");
                        if (item) {
                            this.listItemActivated(item);
                        }
                    }
                    break;
                case 40:
                    // DOWN
                    if (this.listVisibility_internal_()) {
                        evt.preventDefault();
                        item = this.listItemActivated();
                        item = this._getListItemRelative(item, "next-visible");
                        if (item) {
                            this.listItemActivated(item);
                        }
                    }
                    break;
                }
            }
        },
        statics: {
            captureKeyCodeList: [13, 38, 40],
            caretRect: function () {
                var selection = window.getSelection(),
                    rect;
                if (selection.rangeCount) {
                    rect = selection.getRangeAt(0).getClientRects()[0];
                }
                if (rect) {
                    rect = {
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height
                    };
                }
                return rect;
            },
            adjustListPosition: function (mode, input, list) {
                var parent = input.dom().offsetParent;
                if (!parent) {
                    return;
                }
                var rect, prect = parent.getBoundingClientRect();
                var pleft = parent.scrollLeft,
                    ptop = parent.scrollTop;
                switch (mode) {
                case "caret":
                    var rect = CLASS.caretRect();
                    rect.top += ptop - prect.top;
                    rect.left += pleft - prect.left;
                    // set the list position
                    // FIXME to the document's bound, the list position should be fixed
                    list.dom().setStyle("left", rect.left);
                    list.dom().setStyle("top", rect.top + rect.height);
                    break;
                case "input":
                case "select":
                default:
                    // get the correct rect
                    var rect = input.dom().getBound();
                    rect.top += ptop - prect.top;
                    rect.left += pleft - prect.left;
                    // set the list position
                    // FIXME to the document's bound, the list position should be fixed
                    list.dom().setStyle("left", rect.left);
                    list.dom().setStyle("top", rect.top + rect.height);
                    list.dom().setStyle("width", rect.width);
                    break;
                }
            },
            selectorByPath: function (path) {
                function getKeys(data) {
                    var i, item, keys = [];
                    for (i = 0; i < data.length; i++) {
                        item = data[i];
                        keys.push(nx.path(item, path));
                    }
                    return keys;
                }

                function match(keyword, key) {
                    return key && key.toLowerCase().replace(/\s/g, "").indexOf(keyword.toLowerCase().replace(/\s/g, "")) == 0 && key.length > keyword.length;
                }
                return function (replaceInfo, data) {
                    var i, keys, rslt = [];
                    if (replaceInfo) {
                        keys = getKeys(data);
                        keyword = replaceInfo.keyword;
                        for (i = 0; i < data.length; i++) {
                            if (match(keyword, keys[i])) {
                                rslt.push(data[i]);
                            }
                        }
                    }
                    return rslt;
                };
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
(function(nx) {
    var EXPORT = nx.define("nx.lib.component.CentralizedImage", nx.ui.Element, {
        view: {
            attributes: {
                class: ["nx-centralized-image"]
            },
            content: {
                name: "image",
                type: "nx.ui.tag.Image",
                attributes: {
                    src: nx.binding("src")
                },
                events: {
                    load: function() {
                        var image = this.image();
                        var dom = image.dom();
                        if (this.clip()) {
                            image.toggleClass("size-height", dom.height > dom.width);
                            image.toggleClass("size-width", dom.width >= dom.height);
                        } else {
                            image.toggleClass("size-height", dom.height < dom.width);
                            image.toggleClass("size-width", dom.width <= dom.height);
                        }
                        this.fire("ready");
                    }
                }
            }
        },
        properties: {
            src: {},
            clip: true
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".nx-centralized-image": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nx-centralized-image > img": {
                    "position": "absolute",
                    "left": "0px",
                    "top": "0px",
                    "right": "0px",
                    "bottom": "0px",
                    "margin": "auto"
                },
                ".nx-centralized-image > img.size-height": {
                    "width": "100%"
                },
                ".nx-centralized-image > img.size-width": {
                    "height": "100%"
                }
            })
        }
    });
})(nx);
(function (nx) {
    var Matrix = nx.geometry.Matrix;
    var cssstyle = nx.util.cssstyle;
    var EXPORT = nx.define("nx.lib.component.SvgIcon", nx.ui.Element, {
        view: {
            cssclass: "nx-comp svg-icon",
            content: {
                type: "nx.ui.tag.Image",
                attributes: {
                    src: "{imgsrc}"
                }
            }
        },
        properties: {
            src: "",
            bgsrc: "",
            key: "",
            resize: null,
            fill: null,
            svg: {
                dependencies: "src",
                async: true,
                value: function (property, src) {
                    this.release("svg");
                    src && this.retain("svg", EXPORT.loadSvg(src, function (svg) {
                        property.set(svg);
                    }));
                }
            },
            bgsvg: {
                dependencies: "bgsrc",
                async: true,
                value: function (property, src) {
                    this.release("bgsvg");
                    src && this.retain("bgsvg", EXPORT.loadSvg(src, function (svg) {
                        property.set(svg);
                    }));
                }
            },
            imgsrc: {
                dependencies: "svg,bgsvg,key,resize,fill",
                value: function (svg, bgsvg, key, resize, fill) {
                    if (!svg) {
                        return "//:0";
                    }
                    if (!key) {
                        return nx.lib.svg.Svg.serialize(bgsvg || svg) || "//:0";
                    } else {
                        var dom = svg.querySelector("#" + key);
                        if (!dom) {
                            return "//:0";
                        }
                        var tmp, size, width, height, matrix;
                        size = EXPORT.getSvgSize(svg);
                        if (bgsvg) {
                            bgsvg = bgsvg.cloneNode(true);
                            resize = EXPORT.getSvgSize(bgsvg);
                        } else {
                            // create an SVG
                            bgsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                            if (resize) {
                                bgsvg.setAttribute("width", resize.width + "px");
                                bgsvg.setAttribute("height", resize.height + "px");
                            } else {
                                bgsvg.setAttribute("width", size.width + "px");
                                bgsvg.setAttribute("height", size.height + "px");
                            }
                        }
                        // clone the target dom
                        dom = dom.cloneNode(true);
                        dom.removeAttribute("id");
                        EXPORT.cleanStyle(dom);
                        // check if resizing
                        if (resize && resize.width && resize.height) {
                            width = size.width, height = size.height;
                            if (width && height) {
                                scale = Math.min(resize.width / width, resize.height / height);
                                matrix = Array([scale, 0, 0], [0, scale, 0], [0, 0, 1]);
                                // wrap dom
                                tmp = document.createElementNS("http://www.w3.org/2000/svg", "g");
                                tmp.appendChild(dom);
                                dom = tmp;
                                cssstyle.set(dom, "transform", nx.util.cssstyle.toCssTransformMatrix(matrix));
                            }
                        }
                        // append to svg
                        cssstyle.set(dom, "fill", fill);
                        bgsvg.appendChild(dom);
                        // create image source
                        return nx.lib.svg.Svg.serialize(bgsvg);
                    }
                }
            }
        },
        statics: {
            cleanStyle: function (dom) {
                if (dom instanceof Element) {
                    dom.removeAttribute("class");
                    dom.removeAttribute("style");
                    var i, n = dom.childNodes.length;
                    for (i = 0; i < n; i++) {
                        EXPORT.cleanStyle(dom.childNodes[i]);
                    }
                }
            },
            loadSvg: function (url, callback) {
                return nx.util.ajax({
                    url: url,
                    success: function (resources, svg) {
                        if (typeof svg === "string") {
                            var temp = document.createElement("div");
                            temp.innerHTML = svg;
                            svg = temp.querySelector("svg");
                        } else if (!svg.tagName || svg.tagName.toLowerCase() !== "svg") {
                            svg = svg.querySelector("svg");
                        }
                        callback(svg);
                    }
                });
            },
            getSvgSize: function (svg) {
                var width = svg.getAttribute("width");
                var height = svg.getAttribute("height");
                var vb = svg.getAttribute("viewBox");
                if (width) {
                    width = width.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (height) {
                    height = height.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (vb) {
                    vb = vb.split(" ");
                    width = width || vb[2] * 1 || 0;
                    height = width || vb[3] * 1 || 0;
                }
                return {
                    width: width || 0,
                    height: height || 0
                };
            },
            CSS: nx.util.csssheet.create({
                ".nx-comp.svg-icon": {
                    "position": "relative"
                },
                ".nx-comp.svg-icon > img": {
                    "width": "100%",
                    "height": "100%",
                    "outline": "none",
                    "border": "0"
                },
                ".nx-comp.svg-icon:after": {
                    "content": " ",
                    "position": "absolute",
                    "background": "transparent",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%"
                }
            })
        }
    });
})(nx);
