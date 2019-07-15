(function (nx) {
    var EXPORT = nx.define("devme.manage.main.Header", nx.ui.Element, {
        view: {
            cssclass: "glance-main-header",
            content: [{
                type: "glance.common.IconPerson",
                cssclass: "profile"
            }, {
                cssclass: "brand",
                content: {
                    type: "glance.common.BrandA"
                }
            }]
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-main-header": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "height": "2em",
                    "line-height": "2em",
                    "background": "#00224e"
                },
                ".glance-main-header > .brand": {
                    "display": "inline-block",
                    "padding": ".5em",
                    "vertical-align": "top",
                    "height": "1em"
                },
                ".glance-main-header > .brand > img": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "height": "1em"
                },
                ".glance-main-header > .profile": {
                    "float": "right",
                    "margin": "0.5em",
                    "height": "1em"
                }
            })
        }
    });
})(nx);
