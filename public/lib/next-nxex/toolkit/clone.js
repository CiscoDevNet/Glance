(function (nx, ui, toolkit, global) {
    var EXPORT = nx.path(toolkit, "clone", function (self) {
        // TODO clone DOM object
        if (window === self || document === self) {
            // window and document cannot be clone
            return null;
        }
        var dest;
        if ($.isArray(self)) {
            dest = [];
            nx.each(self, function (item) {
                dest.push(EXPORT(item));
            });
        } else if ($.isPlainObject(self)) {
            dest = {};
            $.extend(true, dest, self);
        } else {
            dest = self;
        }
        return dest;
    });
})(nx, nx.ui, nxex.toolkit, window);
