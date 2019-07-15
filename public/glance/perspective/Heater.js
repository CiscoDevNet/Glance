/**
 * Created by Jay on 2016/12/8.
 */
(function(nx) {
    var EXPORT = nx.define("glance.perspective.Heater", {
        properties: {
            thread: {
                set: function() {
                    throw new Error("Thread is readonly for router.");
                }
            },
            //the queue contains all requests going to be handled
            //the first element in the queue is in working
            queue: function() {
                return [];
            }
        },
        methods: {
            init: function() {
                this.inherited();
                var thread = new nx.lib.thread.Thread("glance/perspective/thread-heatmap.js");
                this._thread = thread;
                //when get message from child-thread,run callback and delete this resource
                //then send a new message to child-thread
                this.retain(thread.on("message", function(sender, message) {
                    var id = message.id;
                    var request = this.queue().find(function(req) {
                        return req.id === id;
                    });
                    if (request) {
                        request.callback.call(request.requester, message.vertices);
                        request.resource.release();
                    }
                    if (this.queue().length > 0) {
                        this.nextRequest();
                    }
                }.bind(this)));
                this.notify("thread");
            },
            //when main-thread run getHeatByDensity,create a new request and set queue by the new request
            getHeatByDensity: function(requester, vertices, density, depth, height, callback) {
                var id = nx.uuid(true);
                var request = {
                    requester: requester,
                    id: id,
                    vertices: vertices,
                    density: density,
                    depth: depth,
                    height: height,
                    callback: callback
                };
                var index = this.queue().findIndex(function(item) {
                    return (item.requester === request.requester);
                });
                if (index > 0) {
                    this.queue()[index] = request;
                } else {
                    this.queue().push(request);
                }
                request.resource = {
                    release: function() {
                        var index = this.queue().findIndex(function(req) {
                            return req.id === id;
                        });
                        if (index >= 0) {
                            this.queue().splice(index, 1);
                        }
                    }.bind(this)
                };
                if (this.queue().length === 1) {
                    this.nextRequest();
                }
                return request.resource;
            },
            //send message to child-thread
            nextRequest: function() {
                if (this.queue()) {
                    var request = this.queue()[0];
                    this.thread().send({
                        id: request.id,
                        vertices: request.vertices,
                        density: request.density,
                        depth: request.depth,
                        height: request.height
                    });
                }
            }
        }
    })
})(nx);
