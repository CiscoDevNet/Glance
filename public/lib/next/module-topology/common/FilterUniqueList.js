(function (nx, global) {

    /**
     * @class FilterUniqueList
     * @extends nx.UniqueList
     * @namespace nx.topology.common
     * @protected
     */
    nx.define('nx.topology.common.FilterUniqueList', nx.UniqueList, {
        properties: {
            /**
             * Make sure each item equal user's expectation.
             *
             * @type Function<Boolean>
             * @property filters
             */
            filters: {
                set: function () {
                    throw new Error("Unable to set filters of List");
                },
                watcher: function (propertyName, propertyValue) {
                    this.release("syncFilters");
                    if (propertyValue) {
                        this.retain("syncFilters", propertyValue.monitorContaining(function (filter) {
                            if (typeof filter !== "function") {
                                return;
                            }
                            // remove duplicated items
                            var data = this._data;
                            var i, len = data.length;
                            for (i = len - 1; i >= 0; i--) {
                                if (!filter(data[i])) {
                                    this.removeAt(i);
                                }
                            }
                        }, this));
                    }
                }
            }
        },
        methods: {
            init: function (data, filters) {
                this.inherited(data);
                // create filters
                this._filters = new nx.topology.common.FilterList((nx.is(filters, "Array") || nx.is(filters, nx.List)) ? filters : (filters && [filters]));
                this.notify("filters");
            },
            _differ: function (diffs) {
                // check if filer available
                var filters = this.filters();
                if (!filters) {
                    return this.inherited(diffs);
                }
                // check if it's all removes
                for (i = 0; i < diffs.length; i++) {
                    if (diffs[i][0] !== "remove") {
                        // TODO move
                        // not all removes
                        var i, value, joins, drops, diff, counting;
                        var data = this._data;
                        // optimize for single diff
                        if (diffs.length === 1) {
                            diff = diffs[0];
                            counting = this._counting_map;
                            // check the duplication and get the actual diffs
                            switch (diff[0]) {
                            case "splice":
                                joins = diff[3];
                                drops = data.slice(diff[1], diff[1] + diff[2]);
                                // clear joins for duplication
                                for (i = joins.length - 1; i >= 0; i--) {
                                    value = joins[i];
                                    if (!filters.match(value)) {
                                        if (joins === diff[3]) {
                                            joins = joins.slice();
                                            diffs = [
                                                ["splice", diff[1], diff[2], joins]
                                            ];
                                        }
                                        joins.splice(i, 1);
                                    }
                                }
                                break;
                            }
                            // check if any diff necessary
                            if (diffs && diffs.length) {
                                return this.inherited(diffs);
                            } else {
                                return null;
                            }
                        }
                        // TODO more optimize by pre-reject insert
                        var evt = this.inherited(diffs);
                        for (i = data.length - 1; i > 0; i--) {
                            value = data[i];
                            if (!filter.match(value)) {
                                data.splice(i, 1);
                                if (evt.diffs === diffs) {
                                    evt.diffs = evt.diffs.slice();
                                }
                                evt.diffs.push(["splice", i, 1, []]);
                                evt.drops.push([value]);
                                evt.joins.push([]);
                            }
                        }
                        return evt;
                    }
                    break;
                }
                return this.inherited(diffs);
            }
        }
    });

}(nx, nx.global));
