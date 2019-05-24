(function(nx) {
    var EXPORT = nx.define("glance.editor.MapRegion", glance.editor.MapPath, {
        view: {
            cssclass: "region",
            capture: "{editor.interactor.region}",
            content: [{
                type: "glance.editor.MapLabel",
                properties: {
                    editor: "{editor}",
                    model: "{model.label}"
                }
            }]
        }
    });
})(nx);
