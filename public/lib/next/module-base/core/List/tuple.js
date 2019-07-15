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
