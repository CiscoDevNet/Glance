(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.graph.stage.StageControllerButton", nxex.graph.Node, {
        struct: {
            properties: {
                class: "nxex-stage-button"
            },
            content: [{
                type: "nxex.graph.shape.Rectangle",
                properties: {
                    class: "face",
                    width: binding("width"),
                    height: binding("height")
                }
            }, {
                type: "nxex.graph.shape.PathGroup",
                properties: {
                    class: "icon",
                    x: binding("width, iconSize_internal_", function (width, iconSize) {
                        return (width - iconSize) / 2;
                    }),
                    y: binding("height, iconSize_internal_", function (height, iconSize) {
                        return (height - iconSize) / 2;
                    }),
                    scale: binding("iconSize_internal_", function (iconSize) {
                        return iconSize / 1200;
                    }),
                    data: binding("icon", function (icon) {
                        if (icon) {
                            return EXPORT.ICONS[icon];
                        } else {
                            return [];
                        }
                    })
                }
            }]
        },
        properties: {
            icon: {},
            width: {
                value: 32
            },
            height: {
                value: 32
            },
            iconSize_internal_: {
                value: 16,
                cascade: {
                    source: "width, height",
                    output: function (width, height) {
                        return Math.min(width, height) / 1.625;
                    }
                }
            }
        },
        statics: {
            ICONS: {
                selectable: [{
                    d: "M0 400v300q0 165 117.5 282.5t282.5 117.5q366 -6 397 -14l-186 -186h-311q-41 0 -70.5 -29.5t-29.5 -70.5v-500q0 -41 29.5 -70.5t70.5 -29.5h500q41 0 70.5 29.5t29.5 70.5v125l200 200v-225q0 -165 -117.5 -282.5t-282.5 -117.5h-300q-165 0 -282.5 117.5 t-117.5 282.5zM436 341l161 50l412 412l-114 113l-405 -405zM995 1015l113 -113l113 113l-21 85l-92 28z"
                }],
                draggable: [{
                    d: "M0 603l300 296v-198h200v200h-200l300 300l295 -300h-195v-200h200v198l300 -296l-300 -300v198h-200v-200h195l-295 -300l-300 300h200v200h-200v-198z"
                }],
                plus: [{
                    d: "M0 400v300h400v400h300v-400h400v-300h-400v-400h-300v400h-400z"
                }],
                minus: [{
                    d: "M200 400h900v300h-900v-300z"
                }],
                zoomdot: [{
                    d: "M506.966-19.994c-133.333,0.008-247.33,47.348-341.992,142.02C70.313,216.697,22.986,330.701,22.993,464.034c0.008,133.333,47.348,247.33,142.02,341.992c94.673,94.661,208.676,141.987,342.009,141.98c94.667-0.006,181.665-26.011,260.995-78.016l300.018,299.983c5.334,4.667,11.334,6.999,18,6.999c6.666-0.001,12.666-2.334,18-7.001l108.993-109.006c4.666-5.334,7-11.334,6.999-18.001c0-6.667-2.334-12.667-7.001-17.999L913.009,724.983c51.995-79.336,77.99-166.338,77.984-261.005c-0.007-133.333-47.348-247.331-142.02-341.991C754.302,27.326,640.299-20.001,506.966-19.994z M506.975,133.007c90.667-0.006,168.335,32.324,233.006,96.986c64.669,64.663,97.008,142.661,97.013,233.994c0.006,91.333-32.156,169.169-96.486,233.506c-64.329,64.337-142.161,96.508-233.494,96.514c-91.333,0.005-169.169-32.157-233.506-96.487c-64.337-64.329-96.508-142.161-96.514-233.494c-0.005-91.333,32.323-169.335,96.987-234.006C338.644,165.351,416.308,133.012,506.975,133.007z M599.981,257.001l-200,0.012l0.006,100l-100,0.006l0.012,200l100-0.006l0.006,100l200-0.012l-0.006-100l100-0.006l-0.012-200l-100,0.006L599.981,257.001z"
                }],
                maximize: [{
                    d: "M0 0v400l129 -129l200 200l142 -142l-200 -200l129 -129h-400zM0 800l129 129l200 -200l142 142l-200 200l129 129h-400v-400zM729 329l142 142l200 -200l129 129v-400h-400l129 129zM729 871l200 200l-129 129h400v-400l-129 129l-200 -200z"
                }],
                exportable: [{
                    d: "M0,1200V925c0-7.334,2.333-13.334,7-18s10.666-7,18-7h1048c7.333,0,13.667,2.5,19,7.5s8,10.834,8,17.5v275H0z M200,588l212,212l98-97L297,491L200,588z M300,0l239,250L390,399l212,212l149-148l249,237L999,3L300,0z M900,1050h100v-50H900V1050z"
                }],
                configure: [{
                    d: "M26 601q0 -33 6 -74l151 -38l2 -6q14 -49 38 -93l3 -5l-80 -134q45 -59 105 -105l133 81l5 -3q45 -26 94 -39l5 -2l38 -151q40 -5 74 -5q27 0 74 5l38 151l6 2q46 13 93 39l5 3l134 -81q56 44 104 105l-80 134l3 5q24 44 39 93l1 6l152 38q5 40 5 74q0 28 -5 73l-152 38 l-1 6q-16 51 -39 93l-3 5l80 134q-44 58 -104 105l-134 -81l-5 3q-45 25 -93 39l-6 1l-38 152q-40 5 -74 5q-27 0 -74 -5l-38 -152l-5 -1q-50 -14 -94 -39l-5 -3l-133 81q-59 -47 -105 -105l80 -134l-3 -5q-25 -47 -38 -93l-2 -6l-151 -38q-6 -48 -6 -73zM385 601 q0 88 63 151t152 63t152 -63t63 -151q0 -89 -63 -152t-152 -63t-152 63t-63 152z"
                }]
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
