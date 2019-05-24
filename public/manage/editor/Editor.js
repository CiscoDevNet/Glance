(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.Editor", nx.ui.Element, {
        view: {
            cssclass: "glance-editor",
            content: [{
                name: "header",
                type: "devme.manage.editor.Header",
                cssclass: "header",
                properties: {
                    title: "{model.name}"
                },
                events: {
                    close: function () {
                        this.model().name(this.header().title());
                        this.fire("close", this.model());
                    }
                }
            }, {
                cssclass: "body",
                content: [{
                    type: "devme.manage.editor.Toolbar",
                    cssclass: "toolbar",
                    properties: {
                        model: "{model}"
                    }
                }, {
                    type: "devme.manage.editor.Workspace",
                    cssclass: "workspace",
                    properties: {
                        model: "{model}"
                    }
                }]
            }]
        },
        properties: {
            model: function () {
                return new devme.manage.editor.model.EditorModel();
            }
        },
        methods: {
            init: function () {
                this.inherited();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor": {
                    "font-size": "2em",
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px"
                },
                ".glance-editor > .body > .toolbar": {
                    "position": "absolute",
                    "right": "0px",
                    "width": "10em",
                    "top": "0px",
                    "bottom": "0px",
                    "border-left": "1px solid #b3b3b3"
                },
                ".glance-editor > .body": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "2em",
                    "bottom": "0px",
                    "background": "#ffffff"
                }
            })
        }
    });
})(nx);
