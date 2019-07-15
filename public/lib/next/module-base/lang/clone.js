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
