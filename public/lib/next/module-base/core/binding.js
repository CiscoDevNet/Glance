(function (nx) {
    nx.binding = function (paths, async, handler) {
        if (!(this instanceof nx.binding)) {
            // call as factory
            return new nx.binding(paths, async, handler);
        }
        // call as constructor
        if (arguments.length) {
            // optionalize arguments
            if (typeof paths === "function") {
		// (handler Function)
                handler = paths;
                async = false;
                paths = [];
            } else if (typeof paths === "boolean") {
		// (async Boolean, handler Function)
                handler = async;
                async = paths;
                paths = [];
            } else if (typeof async === "function") {
		// (paths String|Array, handler Function)
                handler = async;
                async = false;
            } else if (typeof paths !== "string" && !nx.is(paths, "Array")) {
		// (config Object)
                // paths is a config object
                handler = paths.handler;
                async = paths.async;
                paths = paths.paths || [];
            }
            // check for "," separated string paths
            if (typeof paths === "string") {
                paths = paths.replace(/\s/g, "").split(",");
            }
            // create options
            this.paths = paths;
            this.async = async;
            this.handler = handler;
        }
    };
})(nx);
