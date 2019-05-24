(function(nx) {
    /**
     * @class Thread
     * @namespace nx.lib.thread
     */
    var EXPORT = nx.define("nx.lib.thread.Thread", {
        properties: {
            worker: null
        },
        methods: {
            init: function(src) {
                this.inherited();
                // TODO leak?
                var worker = this.worker(new Worker(src));
                worker.onmessage = function(evt) {
                    this.fire("message", evt.data);
                }.bind(this);
            },
            send: function(message) {
                this.worker().postMessage(message);
            }
        }
    });
})(nx);
