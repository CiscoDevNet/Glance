(function (nx) {
    var EXPORT = nx.define("devme.manage.main.Main", nx.ui.Element, {
        view: {
            cssclass: "glance-main",
            content: [{
                type: "devme.manage.main.Header",
                cssclass: "header"
            }, {
                type: "devme.manage.main.List",
                cssclass: "list"
            }]
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-main": {
                    "font-size": "2em",
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px"
                }
            })
        }
    });
})(nx);
