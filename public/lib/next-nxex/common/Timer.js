(function (nx, position, dom, ui, global) {
    // TODO more events: keydown, keyup, keypress, etc.
    var CLASS = nx.define("nxex.common.Timer", nxex.Observable, {
        properties: {
            interval: {
                watcher: function (pname, pvalue) {
                    if (this._timer) {
                        global.clearInterval(this._timer);
                        this._timer = null;
                    }
                    if (pvalue | 0) {
                        this._timer = setInterval(function () {
                            this.now(new Date());
                        }.bind(this), pvalue | 0);
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
                this.interval((interval | 0) || 1000);
                this.inherited();
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
