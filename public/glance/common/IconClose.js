(function(nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("glance.common.IconClose", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
            }
        },
        properties: {
            srcText: 'data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" enable-background="new 0 0 14 14" xml:space="preserve">' +
                '<g id="Phone_x5F_Check_in">' +
                '<g id="Firework">' +
                '</g>' +
                '<g>' +
                '<path fill="#4E4E4E" d="M10.273,11.241L2.759,3.727l0.968-0.968l7.514,7.514L10.273,11.241z"/>' +
                '</g>' +
                '<g>' +
                '<path fill="#4E4E4E" d="M3.727,11.241l-0.968-0.969l7.515-7.514l0.968,0.968L3.727,11.241z"/>' +
                '</g>' +
                '</g>' +
                '</svg>'
        }
    });
})(nx);
