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
