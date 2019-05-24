(function(nx) {
    /**
     * @class Image
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Image", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("img");
            }
        },
        statics: {
            load: function(url, callback) {
                var resources = new nx.Object();
                var img = document.createElement("img");
                img.onload = function() {
                    callback && callback({
                        success: true,
                        image: img,
                        size: {
                            width: img.width,
                            height: img.height
                        }
                    });
                };
                img.onerror = function() {
                    callback && callback({
                        success: false,
                        image: img
                    });
                };
                img.src = url;
                resources.retain({
                    release: function() {
                        img = callback = null;
                    }
                });
                return resources;
            }
        }
    });
})(nx);
