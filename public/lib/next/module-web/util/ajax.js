(function () {
    nx.path(nx.global, "nx.util.ajax", (function () {
        var ajax = nx.global.$ ? $.ajax : (function () {
            // TODO
        })();
        return function (opts) {
            // TODO get real opts
            var options = nx.extend({}, opts);
            var resources = new nx.Object();
            // wrap returning functions
            options.success = function () {
                resources.release("abort");
                opts.success && nx.func.apply(opts.success, this, resources, arguments);
            };
            options.error = function () {
                resources.release("abort");
                opts.error && nx.func.apply(opts.error, this, resources, arguments);
            };
            options.complete = function () {
                resources.release("abort");
                opts.complete && nx.func.apply(opts.complete, this, resources, arguments);
            };
            // call ajax
            var xhr = ajax(options);
            // retain abort function
            resources.retain("abort", {
                release: function () {
                    xhr.abort();
                }
            });
            return resources;
        };
    })());
})(nx);
