(function (nx) {
    // TODO
    nx.sets = function (target, values) {
        for (var key in values) {
            nx.path(target, key, values[key]);
        }
    };
})(nx);
