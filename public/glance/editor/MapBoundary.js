(function(nx) {
    var EXPORT = nx.define("glance.editor.MapBoundary", glance.editor.MapPath, {
        view: {
            cssclass: "boundary",
            capture: "{editor.interactor.boundary}"
        }
    });
})(nx);
