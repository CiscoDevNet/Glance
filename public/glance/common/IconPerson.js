(function(nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("glance.common.IconPerson", nx.ui.tag.Image, {
        view: {
            attributes: {
                src: nx.binding("srcText", function(srcText) {
                    return !srcText ? "" : srcText.replace(/#/g, "%23");
                })
            }
        },
        properties: {
            srcText: 'data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="24px" viewBox="0 0 20 24" enable-background="new 0 0 20 24" xml:space="preserve">' +
                '<path fill-rule="evenodd" clip-rule="evenodd" fill="#B4B4B4" d="M0.13,19.527c0,0,1.36-1.589,2.042-1.879' +
                'c0.511-0.217,1.018-0.441,1.535-0.641c0.26-0.1,1.225-0.576,1.499-0.621c0.342-0.057,0.54-0.986,0.746-1.439' +
                'c0.054-0.119,0.126-0.18,0.252-0.197c0.096-0.014,0.188-0.055,0.285-0.068c0.076-0.012-0.071-0.273-0.084-0.337' +
                'c-0.256-0.255-0.389-0.433-0.459-0.536c-0.122-0.175-0.118-0.592-0.143-0.781c-0.056-0.435-0.092-0.871-0.134-1.307' +
                'c-0.01-0.115-0.015-0.229-0.024-0.344c-0.01-0.1-0.023-0.144-0.138-0.156c-0.424-0.041-0.713-0.269-0.86-0.67' +
                'c-0.055-0.154-0.113-0.309-0.148-0.468C4.415,9.707,4.358,9.327,4.327,8.942C4.306,8.683,4.28,8.63,4.235,8.373' +
                'C4.218,8.268,4.362,7.714,4.401,7.65c0.206-0.328,0.233-0.673,0.141-1.047c-0.105-0.425-0.15-0.861-0.188-1.297' +
                'C4.319,4.923,4.312,4.54,4.338,4.161c0.058-0.868,0.27-1.692,0.841-2.379c0.343-0.414,0.772-0.718,1.277-0.91' +
                'c0.386-0.146,0.77-0.299,1.158-0.436c0.469-0.165,0.948-0.287,1.439-0.365C9.339,0.026,9.629-0.002,9.914,0' +
                'c0.645,0.007,1.271,0.125,1.875,0.378c0.407,0.172,2.605,1.256,2.793,2.509c0.088,0.586,0.131,1.16,0.082,1.746' +
                'c-0.037,0.445-0.064,0.892-0.113,1.336c-0.029,0.266-0.015,0.532-0.023,0.798c-0.007,0.243,0.063,0.463,0.193,0.667' +
                'c0.212,0.335,0.31,0.705,0.314,1.098c0.005,0.688-0.089,1.358-0.339,2.005c-0.115,0.298-0.327,0.481-0.604,0.599' +
                'c-0.34,0.144-0.478,0.422-0.523,0.76c-0.042,0.315-0.07,0.632-0.084,0.951c-0.016,0.378-0.101,0.827-0.36,1.101' +
                'c-0.189,0.197-0.385,0.304-0.434,0.573c-0.019,0.105-0.013,0.187,0.133,0.196c0.157,0.009,0.313,0.05,0.473,0.061' +
                'c0.09,0.006,0.129,0.039,0.166,0.118c0.205,0.442,0.443,1.624,0.83,1.696c0.771,0.143,2.146,0.709,2.86,1.01' +
                'c0.908,0.383,1.813,1.771,2.718,2.161V24H0.13V19.527z"/>' +
                '</svg>'
        }
    });
})(nx);
