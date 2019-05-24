(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class ResourceManager
     * @namespace nxex.struct
     */
    var EXPORT = nx.define("nxex.ResourceManager", nx.Observable, {
        properties: {
            resourceList: {
                value: function () {
                    return [];
                }
            },
            resourceMap: {
                value: function () {
                    return {};
                }
            }
        },
        methods: {
            init: function () {
                this.inherited();
                annotation.apply(this, "watcher,cascade");
            },
            replace: function (name, resource) {
                var map = this.resourceMap();
                if (map[name]) {
                    map[name].release();
                    map[name] = null;
                }
                if (resource && resource.release) {
                    map[name] = resource;
                } else if (typeof resource === "function") {
                    resource = resource();
                    this.replace(name, resource);
                }
            },
            retain: function (resource) {
                if (resource && resource.release) {
                    this.resourceList().push(resource);
                }
            },
            release: function () {
                var resourceList = this.resourceList();
                while (resourceList.length) {
                    resourceList.pop().release();
                }
            },
            dispose: function () {
                this.release();
                this.inherited();
            }
        },
        statics: {
            replace: function (target, key, resource) {
                var map = target;
                if (map[name] && map[name].release) {
                    map[name].release();
                }
                if (resource && resource.release) {
                    map[name] = resource;
                } else {
                    map[name] = null;
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
