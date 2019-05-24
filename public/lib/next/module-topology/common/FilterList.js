(function (nx, global) {

    /**
     * @class Filter
     * @extends nx.UniqueList
     * @namespace nx.topology.common
     * @protected
     */
    nx.define('nx.topology.common.FilterList', nx.UniqueList, {
        methods: {
            match: function (value) {
                var match = true;
                this.each(function (filter) {
                    if (typeof filter === "function") {
                        if (!filter(value)) {
                            match = false;
                            return false;
                        }
                    }
                });
                return match;
            }
        }
    });

}(nx, nx.global));
