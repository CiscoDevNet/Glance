(function (nx, position, dom, ui, global) {
    // TODO more events: keydown, keyup, keypress, etc.
    var CLASS = nx.define("glance.common.Timer", {
        properties: {
            interval: {
                watcher: function (pname, pvalue) {
                    this.release("interval");
                    var timer;
                    if (pvalue | 0) {
                        timer = setInterval(function () {
                            this.now(new Date());
                        }.bind(this), pvalue | 0);
                        this.retain("interval", function () {
                            global.clearInterval(timer);
                        });
                    }
                }
            },
            now: {
                value: function () {
                    return new Date();
                }
            }
        },
        methods: {
            init: function (interval) {
                this.inherited();
                this.interval((interval | 0) || 1000);
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
