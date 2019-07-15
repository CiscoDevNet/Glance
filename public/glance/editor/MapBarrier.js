(function(nx) {
    var EXPORT = nx.define("glance.editor.MapBarrier", glance.editor.MapPath, {
        view: {
            cssclass: "barrier",
            capture: "{editor.interactor.barrier}"
        }
    });
})(nx);
