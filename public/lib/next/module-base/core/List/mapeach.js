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
