(function(nx) {
    var EXPORT = nx.define("glance.editor.MapWall", glance.editor.MapPath, {
        view: {
            cssclass: "entity wall active-{active}",
            capture: "{editor.interactor.wall}"
        },
        properties: {
            editor: null,
            model: null,
            active: nx.binding("editor.model.active, model", function(active, model) {
                return active === model;
            })
        }
    });
})(nx);
