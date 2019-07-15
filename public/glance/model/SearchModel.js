(function(nx) {
    var EXPORT = nx.define("glance.model.SearchModel", {
        properties: {
            world: null,
            visible: false,
            isUseNativeKeyboard: nx.binding("world.whoami.category", function(category) {
                if (category == "screen") {
                    //keyboard
                    return false;
                } else {
                    //nativekeyboard
                    return true;
                }
            }),
            word: "",
            items: function() {
                return new nx.List();
            },
            matched: {
                value: nx.binding("items", function(items) {
                    return items && nx.binding("visible, word", function(visible, word) {
                        return (!visible || !word) ? [] : items.data().filter(function(item) {
                            var name = nx.path(item, "name");
                            var expertises = nx.path(item, "skills");
                            if (glance.common.Util.matchName(word, name)) {
                                return true;
                            }
                            if (glance.common.Util.matchExpertises(word, expertises)) {
                                return true;
                            }
                            return false;
                        });
                    });
                }),
                watcher: function(pname, pvalue, poldvalue) {
                    if (poldvalue) {
                        nx.each(poldvalue, function(item) {
                            if (nx.is(item, glance.model.ClientModel)) {
                                item.attendees().remove(this);
                            }
                        }.bind(this));
                    }
                    if (pvalue) {
                        nx.each(pvalue, function(item) {
                            if (nx.is(item, glance.model.ClientModel)) {
                                item.attendees().push(this);
                            }
                        }.bind(this));
                    }
                }
            }
        }
    });
})(nx);
