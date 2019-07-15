(function (nx) {
    var EXPORT = nx.define("glance.common.BoundMixin", nx.ui.Element, {
        properties: {
            bound: {
                dependencies: "dom",
                async: true,
                value: function (property, dom) {
                    if (!dom) {
                        return;
                    }
                    var self = this;
                    var bound = self.getBound();
                    var timer = setInterval(function () {
                        var b = self.getBound();
                        if (b.left !== bound.left || b.top !== bound.top || b.width !== bound.width || b.height !== bound.height) {
                            property.set(b);
                            bound = b;
                        }
                    }, 20);
                    this.retain({
                        release: function () {
                            clearInterval(timer);
                        }
                    });
                    property.set(bound);
                }
            }
        }
    });
})(nx);
