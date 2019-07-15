nx.ready = function (fn) {
    var callback, called, resources = new nx.Object();
    callback = function () {
        resources.release("recursive");
        // initialize to make sure we got a class or function
        if (typeof fn === "string") {
            fn = nx.path(global, fn);
        }
        // attach the class or call a function
        var instance, node;
        if (typeof fn === "function") {
            if (!fn.__nx__) {
                resources.retain("recursive", fn(resources));
                return;
            }
            instance = new fn();
        } else {
            instance = fn;
        }
        // check if the instance has 'dom' property
        node = nx.path(instance, "dom");
        if (node instanceof Node) {
            document.body.appendChild(node);
            resources.retain("recursive", {
                release: function () {
                    document.body.removeChild(node);
                    instance.release();
                }
            });
        } else {
            resources = instance;
        }
    };
    // make sure to call the callback, even if loaded.
    if (document.readyState === "interactive" || document.readyState === "complete") {
        callback();
    } else {
        window.addEventListener("load", callback);
        resources.retain("recursive", {
            release: function () {
                window.removeEventListener("load", callback);
            }
        });
    }
    return resources;
};
