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
