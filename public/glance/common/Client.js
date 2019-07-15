(function (nx) {
    nx.define("glance.common.Client", {
        methods: {
            init: function (url) {
                this.inherited();
                this._socket = new WebSocket(url);
                this._socket.onmessage = function (evt) {
                    var message = JSON.parse(evt.data);
                    this.fire(message.event, message.data);
                }.bind(this);
            },
            emit: function (ename, data) {
                this._socket.send(JSON.stringify({
                    event: ename,
                    data: data
                }));
            }
        }
    });
})(nx);
