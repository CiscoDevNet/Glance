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
