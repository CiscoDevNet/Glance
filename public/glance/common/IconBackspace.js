(function(nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("glance.common.IconBackspace", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
            }
        },
        properties: {
            srcText: 'data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="58px" height="42px" viewBox="0 0 58 42" enable-background="new 0 0 58 42" xml:space="preserve">' +
                '<g>' +
                '		<rect x="35.983" y="6.444" transform="matrix(0.7069 -0.7073 0.7073 0.7069 -3.5544 32.459)" fill-rule="evenodd" clip-rule="evenodd" fill="#b3b3b3" stroke="#b3b3b3" stroke-miterlimit="10" width="2.815" height="28.148"/>' +
                '		<rect x="35.983" y="6.444" transform="matrix(0.7071 0.7071 -0.7071 0.7071 25.4603 -20.4294)" fill-rule="evenodd" clip-rule="evenodd" fill="#b3b3b3" stroke="#b3b3b3" stroke-miterlimit="10" width="2.815" height="28.149"/>' +
                '</g>' +
                '<g>' +
                '		    <path fill="#b3b3b3" d="M54,4v34H21.729L5.524,20.783L21.7,4H54 M58,0H20L0,20.75L20,42h38V0L58,0z"/>' +
                '</g>' +
                '</svg>'
        }
    });
})(nx);
