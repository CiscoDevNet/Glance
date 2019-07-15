(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Input
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.Table", nxex.struct.Element, {
        view: {
            tag: "table"
        },
        properties: {
            structBaseType: {
                value: function () {
                    return nxex.struct.tag.TableRow;
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
