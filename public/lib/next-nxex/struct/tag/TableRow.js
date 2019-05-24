(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Input
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.TableRow", nxex.struct.Element, {
        view: {
            tag: "tr"
        },
        properties: {
            structBaseType: {
                value: function () {
                    return nxex.struct.tag.TableCell;
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
