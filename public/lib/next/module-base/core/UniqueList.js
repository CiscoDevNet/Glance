(function (nx) {
    var count = nx.array.count;
    nx.define("nx.UniqueList", nx.List, {
        methods: {
            init: function (data) {
                this.inherited(data);
                this.retain(this._counting_register());
            },
            _differ: function (diffs) {
                for (i = 0; i < diffs.length; i++) {
                    var i, value, joins, drops, diff, counting;
                    var data = this._data;
                    if (diffs.length === 1) {
                        diff = diffs[0];
                        counting = this._counting_map;
                        // check the duplication and get the actual diffs
                        switch (diff[0]) {
                        case "splice":
                            joins = diff[3];
                            drops = data.slice(diff[1], diff[1] + diff[2]);
                            // clear joins for duplication
                            for (i = joins.length; i >= 0; i--) {
                                value = joins[i];
                                if (counting.get(value) + count(joins, value) - count(drops, value) > 1) {
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
                    for (i = data.length; i > 0; i--) {
                        value = data[i];
                        if (data.indexOf(value) !== i) {
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
                return this.inherited(diffs);
            }
        }
    });
})(nx);
