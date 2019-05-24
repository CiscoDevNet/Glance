(function (nx, ui, toolkit, global) {
    var EXPORT = nx.path(toolkit, "ajaxs", (function () {
        var ajax = $.ajax;
        var keysof = function (map) {
            var key, keys = [];
            if (map) {
                for (key in map) {
                    keys.push(key);
                }
            }
            return keys;
        };
        return function (options) {
            var ajaxs = options.ajaxs;
            var key, keys = [], results = {}, total = 0, count = 0, errorkey = null;
            keys = keysof(ajaxs);
            total = keys.length;
            var completed = function () {
                if (errorkey) {
                    toolkit.funcall(options.error);
                    toolkit.funcall(options.complete);
                } else {
                    toolkit.funcall(options.success, results);
                    toolkit.funcall(options.complete);
                }
                completed = null;
            };
            nx.each(ajaxs || {}, function (value, key) {
                value = toolkit.clone(value);
                var complete = value.complete, success = value.success, error = value.error;
                value.complete = function () {
                    if (errorkey || total <= count) {
                        completed && completed();
                        toolkit.funapply(toolkit.funbind(complete), arguments);
                    }
                };
                value.success = function (result) {
                    results[key] = result, count++;
                    toolkit.funapply(toolkit.funbind(success), arguments);
                };
                value.error = function () {
                    errorkey = key;
                    toolkit.funapply(toolkit.funbind(error), arguments);
                };
                ajax(value);
            });
        };
    })());
})(nx, nx.ui, nxex.toolkit, window);
