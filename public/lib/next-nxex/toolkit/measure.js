(function (nx, ui, toolkit, global) {
    var EXPORT = nx.path(toolkit, "measure", function (options) {
        /**
         * @doctype MarkDown
         * options:
         * - options.target: DOM Element
         *   - the target element
         * - options.accord: "global" or "document" or "parent" or DOM Element
         *   - *default: "document"*
         *   - "global": according to area of window
         *   - "document": according to scroll area of document.body
         *   - "parent": according to scroll area of offsetParent
         * - options.expect: [key*]
         *   - key: string
         *     - CSS attribute names: get current style numeral value in pixels
         */
    });
})(nx, nx.ui, nxex.toolkit, window);
