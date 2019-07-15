(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Binding
     * @namespace nxex.struct
     */
    var EXPORT = nx.define("nxex.struct.Binding", nx.Observable, {
        properties: {
            source: {},
            output: {},
            async: false
        },
        methods: {
            init: function (source, async, output) {
                this.inherited();
                // optionalize arguments
                if (typeof source === "function") {
                    output = source;
                    sync = false;
                    source = "";
                } else if (typeof source === "boolean") {
                    output = async;
                    async = source;
                    source = "";
                } else if (typeof async === "function") {
                    output = async;
                    async = false;
                }
                // create options
                var options;
                if (typeof source === "string") {
                    options = {
                        source: source,
                        async: async,
                        output: output
                    };
                } else {
                    options = source;
                }
                // set options
                this.sets(options);
            },
            bind: function (target, handle) {
                if (this.source()) {
                    var cascading = nx.Observable.monitor(target, this.source(), function () {
                        var args = Array.prototype.slice.call(arguments);
                        if (this.async() && this.output()) {
                            this.output().apply(target, [handle].concat(args));
                        } else {
                            var pvalue;
                            if (!this.output()) {
                                pvalue = args[0];
                            } else {
                                pvalue = this.output().apply(target, args);
                            }
                            handle(pvalue);
                        }
                    }.bind(this));
                    return cascading;
                } else {
                    handle(this.output().call(target));
                }
            }
        },
        statics: {
            binding: function (source, async, output) {
                // optionalize arguments
                if (typeof source === "function") {
                    output = source;
                    sync = false;
                    source = "";
                } else if (typeof source === "boolean") {
                    output = async;
                    async = source;
                    source = "";
                } else if (typeof async === "function") {
                    output = async;
                    async = false;
                }
                // create options
                var options;
                if (typeof source === "string") {
                    options = {
                        source: source,
                        async: async,
                        output: output
                    };
                } else {
                    options = source;
                }
                return new EXPORT(options);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
