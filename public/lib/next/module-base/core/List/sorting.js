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
