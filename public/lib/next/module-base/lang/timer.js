(function(nx) {
    nx.timer = function(delay, callback) {
        var internal = {
            timeout: null,
            resources: [],
            again: function(delay2) {
                internal.timeout = setTimeout(function() {
                    clearTimeout(internal.timeout);
                    internal.timeout = null;
                    var resource = callback(internal.again);
                    resource && internal.resources.push(resource);
                }, delay2 >= 0 ? delay2 : delay);
            }
        };
        internal.again(delay);
        return {
            release: function() {
                internal.timeout && clearTimeout(internal.timeout);
                var resource;
                while (internal.resources.length) {
                    resource = internal.resources.pop();
                    if (resource && typeof resource.release === "function") {
                        resource.release();
                    }
                }
            }
        };
    };
})(nx);
