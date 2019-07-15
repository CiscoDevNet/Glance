(function (nx, ui, toolkit, annotation, global) {
    var Element = nxex.struct.Element;
    var Binding = nxex.struct.Binding;
    /**
     * @class Template
     * @namespace nxex.struct
     */
    var EXPORT = nx.define("nxex.struct.Template", nx.Observable, {
        properties: {
            binding: {},
            template: {}
        },
        methods: {
            init: function (options) {
                this.inherited();
                this.sets(options);
            },
            bind: function (owner, parent) {
                var binding = this.binding(),
                    template = this.template();
                if (binding && template) {
                    var resource;
                    var contexts = [];
                    var views = [];
                    var models = [];
                    var differ = function (d) {
                        // TODO optimize
                        var context, view, model, index;
                        // FIXME once "move" appears, fix me
                        if (d.action == "add") {
                            // mark resources
                            index = d.position;
                            model = d.object;
                            view = Element.create(template, parent);
                            context = nxex.struct.TemplateContext.inject(view, owner, parent, model, index);
                            view.resourceManager().retain(Element.update(view, view, template));
                            views.splice(index, 0, view);
                            models.splice(index, 0, model);
                            contexts.splice(index, 0, context);
                            nx.each(contexts, function (context, i) {
                                context.index(i);
                                context.total(models.length);
                            });
                            // attach
                            view.attach(parent, index);
                        } else if (d.action == "remove") {
                            index = d.position >= 0 ? d.position : models.indexOf(d.object);
                            view = views[index];
                            // detach
                            view.detach();
                            view.dispose();
                            // clear resources
                            views.splice(index, 1);
                            models.splice(index, 1);
                            contexts.splice(index, 1);
                            nx.each(contexts, function (context, i) {
                                context.index(i);
                                context.total(models.length);
                            });
                        }
                    };
                    var bound = binding.bind(owner, function (pvalue) {
                        resource && resource.release();
                        if (nx.is(pvalue, nx.data.Collection)) {
                            resource = pvalue.monitor(function (item) {
                                differ({
                                    action: "add",
                                    position: pvalue.indexOf(item),
                                    object: item
                                });
                                return function () {
                                    differ({
                                        action: "remove",
                                        object: item
                                    });
                                };
                            });
                        } else {
                            resource = null;
                            var diff = toolkit.array.diff(models, pvalue || []);
                            nx.each(diff, differ);
                        }
                    });
                    bound.affect();
                    return {
                        release: function () {
                            var view;
                            if (resource) {
                                resource.release();
                            } else {
                                while (views.length) {
                                    view = views.shift();
                                    view.detach();
                                    view.dispose();
                                }
                            }
                            bound.release();
                        }
                    };
                }
            }
        },
        statics: {
            template: function (source, output, template) {
                var binding = null;
                // parse the input forms
                if (nx.is(source, Binding)) {
                    binding = source;
                    template = output;
                } else if (nx.is(source, "String")) {
                    if (nx.is(output, "Function")) {
                        binding = new Binding({
                            source: source,
                            output: output
                        });
                    } else {
                        binding = new Binding({
                            source: source
                        });
                        template = output;
                    }
                } else if (source && source.source && source.template) {
                    binding = new Binding({
                        source: source.source,
                        output: source.output
                    });
                    template = source.template
                }
                // verify the result of parse
                if (template && binding) {
                    return new EXPORT({
                        binding: binding,
                        template: template
                    });
                } else {
                    return [];
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
