(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.InteractManager", {
        properties: {
            owner: null,
            interactor: function() {
                return new glance.editor.interact.Interactor();
            }
        },
        methods: {
            init: function(owner) {
                this.inherited();
                this.owner(owner);
                // TODO register responsors
                nx.each(glance.editor.interact, function(clazz, name) {
                    if (name.indexOf("ResponsorOn") === 0) {
                        if (clazz.RESPONSE_MODES && clazz.RESPONSE_KEY) {
                            var responsor = new clazz();
                            responsor.owner(this.owner());
                            this.registerByResponsor(responsor);
                        }
                    }
                }.bind(this));
            },
            registerByResponsor: function(responsor) {
                var clazz = responsor.__class__;
                var modes = clazz.RESPONSE_MODES || [];
                var key = clazz.RESPONSE_KEY;
                var condition = nx.binding("owner.model.mode", function(mode) {
                    return modes.indexOf(mode) >= 0;
                });
                return this.register(condition, key, responsor);
            },
            register: function(condition, key, responsor) {
                return nx.Object.binding(this, condition, function(met) {
                    if (met) {
                        nx.path(this.interactor(), key, responsor);
                    } else {
                        if (nx.path(this.interactor(), key) === responsor) {
                            nx.path(this.interactor(), key, null);
                        }
                    }
                });
            }
        }
    });
})(nx);
