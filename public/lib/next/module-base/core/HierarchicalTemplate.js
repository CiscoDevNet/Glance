(function (nx) {

    var Hierarchical = nx.Hierarchical;

    var EXPORT = nx.define("nx.HierarchicalTemplate", {
        properties: {
            parent: {},
            list: {},
            template: {},
            context: {}
        },
        methods: {
            init: function (parent, list, template, context) {
                this.inherited();
                this.parent(parent);
                this.list(list);
                this.template(template);
                this.context(context);
                this.retain(nx.Object.cascade(this, "parent,list,template,context", function (parent, list, template, context) {
                    if (list) {
                        this.release("target-list");
                        this.retain("target-list", list.monitorContaining(function (item) {
                            return function () {
                                item.release();
                            };
                        }));
                    }
                    if (parent && list && template) {
                        context = context || parent;
                        this.retain("initial", this.applyBinding(parent, list, template.binding, template.pattern, context));
                    }
                }));
            },
            applyBinding: function (parent, list, binding, pattern, context) {
                var self = this;
                var resource = new nx.Object();
                resource.retain(nx.Object.binding(context, binding, function (pvalue) {
                    resource.release("recursive");
                    if (nx.is(pvalue, nx.binding)) {
                        resource.retain("recursive", self.applyBinding(parent, list, binding, pattern, context));
                    } else if (nx.is(pvalue, nx.List)) {
                        resource.retain("recursive", self.applyList(parent, list, pvalue, pattern, context));
                    } else if (nx.is(pvalue, "Array")) {
                        resource.retain("recursive", self.applyList(parent, list, new nx.List(pvalue), pattern, context));
                    }
                }));
                return resource;
            },
            applyList: function (parent, list, source, pattern, context) {
                context = context || parent;
                var self = this;
                var scopes = nx.List.mapeach(source, "model", {
                    count: "list.length",
                    parent: function () {
                        return parent;
                    },
                    list: function () {
                        return source;
                    },
                    context: function () {
                        return context;
                    },
                    views: nx.binding("parent, context, list, model", function (parent, context, list, model) {
                        if (parent && context && list) {
                            var self = this;
                            this.release("views");
                            var resources = new nx.Object();
                            this.retain("views", resources);
                            return pattern.map(function (meta) {
                                var view = Hierarchical.create(parent, meta);
                                Hierarchical.extendProperty(view, "scope", self);
                                view.retain(view.hierarchicalUpdate(meta, view));
                                resources.retain(view);
                                return view;
                            });
                        }
                    })
                });
                scopes.retain(scopes.monitorDiff(function (evt) {
                    // TODO handle model movings
                    var tdiffs = [];
                    nx.each(evt.diffs, function (sdiff) {
                        var tdiff = sdiff.slice();
                        switch (tdiff[0]) {
                        case "splice":
                            tdiff[1] *= pattern.length;
                            tdiff[2] *= pattern.length;
                            tdiff[3] = tdiff[3].reduce(function (result, scope) {
                                return result.concat(scope.views());
                            }, []);
                            break;
                        case "move":
                            tdiff[1] *= pattern.length;
                            tdiff[2] *= pattern.length;
                            tdiff[3] *= pattern.length;
                        }
                        tdiffs.push(tdiff);
                    });
                    list.differ(tdiffs);
                }));
                return scopes;
            }
        }
    });
})(nx);
