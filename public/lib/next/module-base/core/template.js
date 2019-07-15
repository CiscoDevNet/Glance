(function (nx) {

    nx.template = function (paths, async, handler, pattern) {
        if (!(this instanceof nx.template)) {
            // call as factory
            return new nx.template(paths, async, handler, pattern);
        }
        if (arguments.length) {
            var binding;
            // optionalize arguments
            if (paths instanceof nx.binding) {
                // (binding Binding, pattern Any)
                binding = paths;
                pattern = async;
            } else {
                if (typeof paths === "function") {
                    // (handler Function, pattern Any)
                    pattern = async;
                    handler = paths;
                    async = false;
                    paths = [];
                } else if (typeof paths === "boolean") {
                    // (async Boolean, handler Function, pattern Any)
                    pattern = handler;
                    handler = async;
                    async = paths;
                    paths = [];
                } else if (typeof async === "function") {
                    // (paths String|Array, handler Function, pattern Any)
                    pattern = handler;
                    handler = async;
                    async = false;
                } else if (typeof paths !== "string" && !nx.is(paths, "Array")) {
                    // (config Object)
                    if (nx.is(paths.source, nx.binding)) {
                        pattern = paths.pattern;
                        binding = paths.source;
                    } else {
                        pattern = paths.pattern;
                        handler = paths.handler;
                        async = !!paths.async;
                        paths = paths.paths || [];
                    }
                } else {
                    if (typeof async === "function") {
                        pattern = handler;
                        handler = async;
                        async = false;
                    } else if (typeof async !== "boolean") {
                        pattern = async;
                        handler = null;
                        async = false;
                    }
                }
                // make up binding if necessary
                if (!binding) {
                    binding = nx.binding(paths, async, handler);
                }
            }
            // create options
            this.binding = binding;
            this.pattern = nx.is(pattern, "Array") ? pattern : [pattern];
        }
    };

})(nx);
