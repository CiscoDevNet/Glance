(function(nx) {
    nx.path(nx.global, "nx.util.ajaxs", (function() {
        var ajax = nx.util.ajax;
        var keysof = function(map) {
            var key, keys = [];
            if (map) {
                for (key in map) {
                    keys.push(key);
                }
            }
            return keys;
        };
        return function(options) {
            var resources = new nx.Object();
            var ajaxs = options.ajaxs;
            var key, total, count, keys, results, errorkey, errorval;
            results = {};
            count = 0;
            errorkey = null;
            keys = keysof(ajaxs);
            total = keys.length;
            var completed = function() {
                if (errorkey) {
                    options.error && options.error(errorkey, errorval);
                    options.complete && options.complete();
                } else {
                    options.success && options.success(results);
                    options.complete && options.complete();
                }
                // release all ajaxes
                nx.each(keys, function(key) {
                    resources.release(key);
                });
            };
	    // start all ajaxes
            nx.each(ajaxs || {}, function(value, key) {
                value = nx.extend({}, value);
                var complete = value.complete;
                var success = value.success;
                var error = value.error;
                value.success = function(result) {
                    success && nx.func.apply(success, arguments);
                    results[key] = result, count++;
                };
                value.error = function(result) {
                    nx.func.apply(error, arguments);
                    errorkey = key;
                    errorval = result;
                };
                value.complete = function() {
                    complete && nx.func.apply(complete, arguments);
                    if (errorkey || total <= count) {
                        completed && completed();
                    }
                };
                resources.retain("key", ajax(value));
            });
            return resources;
        };
    })());
})(nx);
