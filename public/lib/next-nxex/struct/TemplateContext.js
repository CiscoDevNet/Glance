(function (nx, ui, toolkit, annotation, global) {
    var Element = nxex.struct.Element;

    /**
     * @class TemplateContext
     * @namespace nxex.struct
     */
    var EXPORT = nx.define("nxex.struct.TemplateContext", nxex.Observable, {
        properties: {
            owner: {},
            parent: {},
            index: {},
            model: {},
            view: {},
            total: {}
        },
        statics: {
            inject: function (view, owner, parent, model, index) {
                var context = new EXPORT();
                // set values
                context.model(model);
                context.owner(owner);
                context.view(view);
                context.parent(parent);
                context.index(index);
                Element.extendProperty(view, "template", context);
		return context;
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
