(function(nx) {
    var EXPORT = nx.define("glance.common.LoadingCircle", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
            }
        },
        properties: {
            srcText: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="100" height="100" viewbox="0 0 100 100">' +
                '<g opacity="0.3">' +
                '<circle fill="none" stroke="#ffffff" stroke-width="7" cx="50%" cy="50%" r="40" stroke-dasharray="100 251" />' +
                '</g>' + '</svg>'
        }
    });
})(nx);
