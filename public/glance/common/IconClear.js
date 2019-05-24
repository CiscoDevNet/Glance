(function(nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("glance.common.IconClear", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
	    }
        },
        properties: {
            srcText: 'data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="42px" height="42px" viewBox="0 0 42 42" enable-background="new 0 0 42 42" xml:space="preserve">' +
                '<g>' +
                '<rect x="19.983" y="6.444" transform="matrix(0.7069 -0.7073 0.7073 0.7069 -8.2435 21.1425)" fill-rule="evenodd" clip-rule="evenodd" fill="#b3b3b3" stroke="#b3b3b3" stroke-miterlimit="10" width="2.815" height="28.148"/>' +
                '<rect x="19.983" y="6.444" transform="matrix(0.7071 0.7071 -0.7071 0.7071 20.774 -9.1157)" fill-rule="evenodd" clip-rule="evenodd" fill="#b3b3b3" stroke="#b3b3b3" stroke-miterlimit="10" width="2.815" height="28.149"/>' +
                '</g>' +
                '<g>' +
                '<path fill="#b3b3b3" d="M38,4v34H4V4H38 M42,0H0v42h42V0L42,0z"/>' +
                '</g>' +
                '</svg>'
        }
    });
})(nx);
