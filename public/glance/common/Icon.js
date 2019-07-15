(function(nx) {
    var EXPORT = nx.define("glance.common.Icon", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
            }
        },
        properties: {
            shape: "",
            color: "black",
            srcText: nx.binding("shape, color", function(shape, color) {
                if (!EXPORT.SHAPES[shape]) {
                    return null;
                }
                return "data:image/svg+xml;utf8," + EXPORT.SHAPES[shape].replace(/\{\{COLOR\}\}/g, color);
            })
        },
        statics: {
            SHAPES: {
                region: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
                    ' x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">' +
                    '<g>' +
                    '<rect x="4" y="4" fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" width="16" height="16"/>' +
                    '<circle fill="{{COLOR}}" cx="4" cy="4" r="2"/>' +
                    '<circle fill="{{COLOR}}" cx="20" cy="4" r="2"/>' +
                    '<circle fill="{{COLOR}}" cx="20" cy="20" r="2"/>' +
                    '<circle fill="{{COLOR}}" cx="4" cy="20" r="2"/>' +
                    '</g>' +
                    '</svg>',
                wall: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
                    ' x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">' +
                    '<g>' +
                    '<polyline fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" points="22,22.18 22,2.179 12,2.179 2,2.179 2,22.18 12,22.18 ' +
                    '12,16.27 17.587,16.27 "/>' +
                    '<line fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" x1="12" y1="12.179" x2="12" y2="2.179"/>' +
                    '</g>' +
                    '</svg>',
                door: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
                    ' x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">' +
                    '<g>' +
                    '<line fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" x1="2.163" y1="11.91" x2="9.163" y2="11.91"/>' +
                    '<line fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" x1="15.163" y1="11.91" x2="22.163" y2="11.91"/>' +
                    '<g>' +
                    '<g>' +
                    '<line fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" x1="12.163" y1="1.91" x2="12.163" y2="20.768"/>' +
                    '<g>' +
                    '<polygon fill="{{COLOR}}" points="10.468,18.775 12.163,20.472 13.858,18.775 13.858,20.215 12.163,21.91 10.468,20.215 "/>' +
                    '</g>' +
                    '</g>' +
                    '</g>' +
                    '</g>' +
                    '</svg>',
                text: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
                    ' x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">' +
                    '<g>' +
                    '<path fill="{{COLOR}}" d="M3.996,2.91h15.383l0.146,4.623h-0.65c-0.32-1.452-0.725-2.397-1.217-2.836' +
                    'c-0.49-0.438-1.525-0.657-3.102-0.657h-1.514v13.922c0,1.048,0.164,1.697,0.492,1.948c0.326,0.251,1.043,0.417,2.151,0.495v0.505' +
                    'H7.756v-0.505c1.15-0.088,1.868-0.276,2.152-0.567c0.283-0.292,0.425-1.023,0.425-2.195V4.04H8.805' +
                    'c-1.506,0-2.529,0.216-3.075,0.65C5.184,5.124,4.775,6.072,4.5,7.533H3.836L3.996,2.91z"/>' +
                    '</g>' +
                    '</svg>',
                legend: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
                    ' x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">' +
                    '<text transform="matrix(1 0 0 1 6.876 16.4707)" fill="{{COLOR}}" font-family="\'FontAwesome\'" font-size="16.486">\uF041</text>' +
                    '<polygon fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" points="20.123,21.48 3.876,21.48 6.876,14.48 17.123,14.48 "/>' +
                    '</svg>',
                area: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
                    ' width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">' +
                    '<g>' +
                    '<rect x="4.286" y="4.222" fill="none" stroke="{{COLOR}}" stroke-miterlimit="10" width="15.554" height="15.556"/>' +
                    '<circle fill="{{COLOR}}" cx="19.841" cy="4.222" r="2.222"/>' +
                    '<circle fill="{{COLOR}}" cx="4.285" cy="19.777" r="2.222"/>' +
                    '</g>' +
                    '</svg>',
                boundary: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve">' +
                    '<path d="M21.1,19.3c0-4.9,0-9.8,0-14.7c1-0.2,1.8-0.9,1.8-2.3c0-2.9-4.1-3.1-4.5-0.5c-0.1,0-0.2,0-0.2,0c-3.6,0-7.2,0-10.8,0c-0.9,0-1.8,0-2.7,0C4.1-0.7,0-0.5,0,2.4c0,1.3,0.8,2.1,1.8,2.3c0,0,0,0.1,0,0.1' +
                    'c0,1.7,0,3.4,0,5.1c0,3.2,0,6.4,0,9.6c-1,0.2-1.8,0.9-1.8,2.2c0,2.8,4,3,4.5,0.5c4.6,0,9.2,0,13.8,0c0.5,2.6,4.5,2.4,4.5-0.5C22.9,20.3,22,19.5,21.1,19.3z M4.5,21.1c-0.2-1-0.9-1.5-1.7-1.7c0-4.9,0-9.8,0-14.8' +
                    'c0.8-0.2,1.6-0.7,1.7-1.8c0.3,0,0.6,0,1,0c3.2,0,6.5,0,9.7,0c1,0,2.1,0,3.1,0c0.2,1,0.9,1.6,1.7,1.8c0,0.3,0,0.6,0,0.8c0,1.5,0,3,0,4.5c0,3.1,0,6.2,0,9.3c0,0,0,0,0,0c-0.8,0.2-1.6,0.8-1.7,1.8c0,0,0,0-0.1,0C13.7,21.1,9.1,21.1,4.5,21.1z"/>' +
                    '</svg>',
                icon_down: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve">' +
                    '<polyline style="fill:#FFFFFF;stroke:#000000;stroke-miterlimit:10;" points="21,8.5 12.5,17 4,8.5 "/></svg>'
            }
        }
    });
})(nx);
