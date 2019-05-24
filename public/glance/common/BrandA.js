(function(nx) {
    var EXPORT = nx.define("glance.common.BrandA", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
            }
        },
        properties: {
            srcText: nx.binding("color", function(color) {
                return 'data:image/svg+xml;utf8,' +
                    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                    'x="0px" y="0px" width="21px" height="24px" viewBox="0 0 21 24" enable-background="new 0 0 21 24" xml:space="preserve">' +
                    '<polyline fill="none" stroke="' +
                    color +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="19.746,22.477 10.5,17.852 1.254,22.477 10.5,1.169 17.636,17.552 10.399,13.833 "/>' +
                    '</svg>';
            }),
            color: "#313131"
        }
    });
})(nx);
