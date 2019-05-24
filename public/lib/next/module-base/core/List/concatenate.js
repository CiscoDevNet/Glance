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
