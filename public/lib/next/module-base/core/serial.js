nx.serial = (function () {
    var id = 1;
    return function () {
        return id++;
    };
})();
