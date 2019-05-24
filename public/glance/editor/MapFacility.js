(function(nx) {
    var EXPORT = nx.define("glance.editor.MapFacility", nx.lib.svg.shape.Circle, {
        view: {
            cssclass: "entity facility active-{model.active}",
            capture: "{editor.interactor.facility}",
            attributes: {
                cx: "{model.position.x}",
                cy: "{model.position.y}",
                r: "20"
            }
        },
        properties: {
            editor: null,
            model: null
        }
    });
})(nx);
