(function(nx) {

    var WorldModel = nx.path(nx.global, "glance.model.WorldModel");

    var EXPORT = nx.define("glance.perspective.StageControlPanel", nx.ui.Element, {
        view: {
            cssclass: "glance-stage-control",
            content: [{
                cssclass: "group group-button perspective",
                content: [{
                    cssclass: ["button perspective-3d", nx.binding("model.disablePerspective", function(disablePerspective) {
                        return "check-" + !disablePerspective;
                    })],
                    content: "3D VIEW",
                    capture: {
                        tap: "{toPerspective3D}"
                    }
                }, {
                    cssclass: ["button perspective-top check-{model.disablePerspective}"],
                    content: "TOP VIEW",
                    capture: {
                        tap: "{toPerspectiveTop}"
                    }
                }]
            }, {
                cssclass: "group group-vertical",
                content: [{
                    cssclass: "button zoom-in",
                    capture: {
                        tap: "{toZoomIn}"
                    }
                }, {
                    cssclass: "zoom",
                    content: {
                        cssclass: "zooming",
                        cssstyle: {
                            "margin-top": nx.binding("model.viewStepActual, model.viewStepZoomingLimit", function(viewStep, viewStepZoomingLimit) {
                                viewStep = viewStep || WorldModel.STEP_MIN;
                                return (5 * (viewStep - viewStepZoomingLimit) / (WorldModel.STEP_MIN - viewStepZoomingLimit) + 0.3) + "em";
                            })
                        }
                    },
                    capture: {
                        drag: nx.idle
                    }
                }, {
                    cssclass: "button zoom-out",
                    capture: {
                        tap: "{toZoomOut}"
                    }
                }, {
                    cssclass: "button zoom-fit",
                    capture: {
                        tap: "{toZoomFit}"
                    }
                }]
            }]
        },
        properties: {
            model: null
        },
        methods: {
            toPerspective3D: function() {
                var model = this.model();
                model.cameraSlop(WorldModel.SLOP_DEFAULT);
                model.disablePerspective(false);
            },
            toPerspectiveTop: function() {
                var model = this.model();
                model.cameraSlop(WorldModel.SLOP_MAX);
                model.cameraRotation(0);
                model.disablePerspective(true);
            },
            toZoomIn: function() {
                var model = this.model();
                model.viewStep(model.viewStep() * 1.5);
                model.viewStep(model.viewStepActual());
            },
            toZoomOut: function() {
                var model = this.model();
                model.viewStep(model.viewStep() / 1.5);
                model.viewStep(model.viewStepActual());
            },
            toZoomFit: function() {
                var model = this.model();
                model.cameraOffsetBreadth(0);
                model.cameraOffsetDepth(0);
                model.viewStep(model.viewStepZooming());
            }
        },
        statics: {
            DEFAULT_DURATION: 300,
            CSS: nx.util.csssheet.create({
                ".glance-stage-control": {
                    "nx:absolute": "2em 2em auto auto",
                    "font-size": ".7em"
                },
                ".glance-stage-control > .group-button": {
                    "display": "flex"
                },
                ".glance-stage-control > .group > .button": {
                    "position": "relative",
                    "text-align": "center",
                    "height": "2em",
                    "line-height": "2.3em",
                    "min-width": "2em",
                    "border": ".1em solid #00bab0",
                    "color": "#00bab0",
                    "cursor": "default"
                },
                ".glance-stage-control > .group > .button.check-true": {
                    "color": "white !important",
                    "background": "#00bab0 !important"
                },
                ".glance-stage-control > .group > .button:hover": {
                    "background": "rgba(0,0,0,.05)"
                },
                ".glance-stage-control > .group > .button:active": {
                    "color": "white",
                    "background": "#00bab0"
                },
                ".glance-stage-control > .group-button > .button:not(:first-child)": {
                    "margin-left": "-.1em"
                },
                ".glance-stage-control > .group-button.perspective > .button": {
                    "width": "6em"
                },
                ".glance-stage-control > .group-button.rotate": {
                    "margin": "1em 0 auto auto",
                    "justify-content": "flex-end"
                },
                ".glance-stage-control > .group-button.rotate > .button:before": {
                    "font-family": "FontAwesome",
                    "line-height": "1em"
                },
                ".glance-stage-control > .group-button.rotate > .button.rotate-clockwise:before": {
                    "content": "\\f01e"
                },
                ".glance-stage-control > .group-button.rotate > .button.rotate-counterclockwise:before": {
                    "content": "\\f0e2"
                },
                ".glance-stage-control > .group-vertical": {
                    "display": "flex",
                    "flex-direction": "column",
                    "float": "right",
                    "margin": "1em 0 auto auto"
                },
                ".glance-stage-control > .group-vertical > *": {
                    "text-align": "center",
                    "line-height": "2.3em",
                    "width": "2em",
                    "border": ".1em solid #00bab0",
                    "color": "#00bab0",
                    "cursor": "default"
                },
                ".glance-stage-control > .group-vertical > :not(:first-child)": {
                    "margin-top": "-.1em"
                },
                ".glance-stage-control > .group-vertical > .button:before": {
                    "line-height": "1em"
                },
                ".glance-stage-control > .group-vertical > .button.zoom-in:before": {
                    "font-family": "FontAwesome",
                    "content": "\\f067"
                },
                ".glance-stage-control > .group-vertical > .button.zoom-out:before": {
                    "font-family": "FontAwesome",
                    "content": "\\f068"
                },
                ".glance-stage-control > .group-vertical > .button.zoom-fit:before": {
                    "content": "FIT"
                },
                ".glance-stage-control > .group-vertical > .button": {
                    "height": "2em"
                },
                ".glance-stage-control > .group-vertical > .zoom": {
                    "position": "relative",
                    "height": "6em"
                },
                ".glance-stage-control > .group-vertical > .zoom:before": {
                    "content": " ",
                    "nx:absolute": ".5em auto",
                    "width": ".1em",
                    "background": "#00bab0"
                },
                ".glance-stage-control > .group-vertical > .zoom > .zooming": {
                    "nx:absolute": "0",
                    "margin": "auto",
                    "width": "70%",
                    "height": ".1em",
                    "border": ".2em solid transparent",
                    "cursor": "pointer"
                },
                ".glance-stage-control > .group-vertical > .zoom > .zooming:before": {
                    "content": " ",
                    "nx:absolute": "0",
                    "background": "#00bab0"
                }
            })
        }
    });
})(nx);
