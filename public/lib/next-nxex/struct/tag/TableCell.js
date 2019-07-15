(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Input
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.TableCell", nxex.struct.Element, {
        view: {
            tag: "td"
        },
        properties: {
            structBaseType: {
                value: function () {
                    return nxex.struct.Element;
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
