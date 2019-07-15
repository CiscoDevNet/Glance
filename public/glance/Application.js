(function(nx) {
    var EXPORT = nx.define("glance.Application", {
        methods: {
            init: function() {
                this.inherited();
                var hash = nx.util.hash;
                var map = hash.map();
                var data;
                if (!map.has("#")) {
                    data = hash.getHashMap();
                    data["#"] = "";
                    hash.setHashMap(data);
                }
                this.retain(map.cascade("#", function(path) {
                    var app = path && path.split("/")[0];
                    var type, view;
                    switch (app) {
                        case "admin":
                            type = glance.admin.Window;
                            break;
                        case "check":
                            type = glance.paging.WindowCheck;
                            break;
                        case "register":
                            type = glance.paging.WindowRegister;
                            break;
                        case "editor":
                            type = glance.editor.Window;
                            break;
                        case "perspective":
                        default:
                            type = glance.perspective.Window;
                            break;
                    }
                    if (!nx.is(nx.global.app, type)) {
                        nx.global.app && nx.global.app.release();
                        nx.global.app = view = new type();
                        view.retain(view.appendTo());
                        return view;
                    }
                }));
            }
        }
    });

    nx.path("glance.service.api", new glance.service.Api());
    nx.ready(EXPORT);

})(nx);
