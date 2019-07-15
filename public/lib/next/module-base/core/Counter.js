(function (nx) {

    nx.define("nx.Counter", nx.Map, {
        methods: {
            init: function () {
                this.inherited(arguments);
                this.on("change", function (sender, evt) {
                    var ov = evt.previousValue || 0;
                    var nv = evt.value || 0;
                    var change = {
                        item: evt.key,
                        previousCount: ov,
                        count: nv
                    };
                    if (ov < nv) {
                        this.fire("increase", change);
                    }
                    if (ov > nv) {
                        this.fire("decrease", change);
                    }
                    this.fire("count", change);
                });
            },
            get: function (key) {
                return this.inherited(key) || 0;
            },
            /**
             * Increase the count of given item.
             *
             * @method increase
             * @param {Any} item The item to count.
             * @param {Number} increment The increment, default 1.
             * @return The increasing result
             */
            increase: function (item, increment) {
                increment = arguments.length > 1 ? Math.floor(increment * 1 || 0) : 1;
                var value = this.get(item) + increment;
                if (value) {
                    return this.set(item, this.get(item) + increment);
                } else {
                    this.remove(item);
                    return 0;
                }
            },
            /**
             * Decrease the count of given item.
             *
             * @method decrease
             * @param {Any} item The item to count.
             * @param {Number} decrement The decrement, default 1.
             * @return The decreasing result
             */
            decrease: function (item, decrement) {
                decrement = arguments.length > 1 ? Math.floor(decrement * 1 || 0) : 1;
                var value = this.get(item) - decrement;
                if (value) {
                    return this.set(item, value);
                } else {
                    this.remove(item);
                    return 0;
                }
            }
        }
    });

})(nx);
