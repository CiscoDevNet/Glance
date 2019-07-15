(function(nx) {
    var EXPORT = nx.path(nx.global, "nx.util.url", function() {
        var href = window.location.href;
        var hash = window.location.hash;
        var search = href.indexOf("?") >= 0 && href.substring(href.indexOf("?") + 1);
        if (search && search.indexOf("#") >= 0) {
            search = search.substring(0, search.indexOf("#"));
        }
        var protocol = window.location.protocol;
        var host = window.location.host;
        var hostname = window.location.hostname;
        var port = window.location.port;
        var pathname = window.location.pathname;
        if (search) {
            search = search.split("&").reduce(function(data, arg) {
                var key, value, idx = arg.indexOf("=");
                if (idx >= 0) {
                    key = decodeURI(arg.substring(0, idx));
                    value = decodeURI(arg.substring(idx + 1));
                } else {
                    key = decodeURI(arg);
                    value = true;
                }
                data[key] = value;
                return data;
            }, {});
        }
        if (hash) {
            hash = hash.split("&").reduce(function(data, arg) {
                var key, value, idx = arg.indexOf("=");
                if (idx >= 0) {
                    key = decodeURI(arg.substring(0, idx));
                    value = decodeURI(arg.substring(idx + 1));
                } else {
                    key = decodeURI(arg);
                    value = null;
                }
                data[key] = value;
                return data;
            }, {});
        }
        return {
            href: href,
            protocol: protocol,
            host: host,
            hostport: host,
            hostname: hostname,
            port: port,
            pathname: pathname,
            search: search,
            hash: hash
        };
    }());
})(nx);
