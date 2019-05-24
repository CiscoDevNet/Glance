(function(nx) {

    var benchmark = nx.path(nx.global, "sanvy.benchmark");

    var FONTS = (function() {
        var paths = {
            CiscoSansRegular: "CiscoSans.normal.normal",
            CiscoSansBold: "CiscoSans.bold.normal"
        };
        var FONTS = {};
        nx.each(paths, function(path, name) {
            var font = nx.path(nx.global, "_typeface_js.faces." + path);
            if (font) {
                FONTS[name] = THREE.FontLoader.prototype.parse(font);
            }
        });
        return FONTS;
    })();

    var EXPORT = nx.define("sanvy.Stage", nx.ui.Element, {
        view: {
            cssclass: "sanvy-stage",
            content: {
                name: "canvas",
                type: "nx.ui.tag.Canvas"
            }
        },
        properties: {
            camera: null,
            width: 0,
            height: 0,
            scene: null,
            dirty: false,
            pickings: {
                value: function() {
                    return new nx.List();
                }
            }
        },
        methods: {
            init: function() {
                this.inherited();
                var renderer, camera, scene, raycaster, timestamp, fps;
                // renderer
                renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true,
                    logarithmicDepthBuffer: true,
                    canvas: this.canvas().dom()
                });
                renderer.setClearColor(0x000000, 0);
                renderer.setPixelRatio(window.devicePixelRatio);
                // camera
                camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000000);
                // scene
                scene = new THREE.Scene();
                scene.scale.y = -1; // to left-handed coordinate system
                // var light = new THREE.AmbientLight(0xffffff, .2);
                var light, color = 0xffffff;
                light = new THREE.DirectionalLight(color, .15);
                light.color.setHSL(0.55, 1, 0.95);
                light.position.set(1, 1, -1.5);
                light.position.multiplyScalar(50);
                light.castShadow = true;
                scene.add(light);
                light = new THREE.DirectionalLight(color, .35);
                light.color.setHSL(0.55, 1, 0.95);
                light.position.set(1, -1, -1.3);
                light.position.multiplyScalar(50);
                light.castShadow = true;
                scene.add(light);
                light = new THREE.DirectionalLight(color, .2);
                light.color.setHSL(0.55, 1, 0.95);
                light.position.set(-1, 1, -1.1);
                light.position.multiplyScalar(50);
                light.castShadow = true;
                scene.add(light);
                light = new THREE.DirectionalLight(color, .3);
                light.color.setHSL(0.55, 1, 0.95);
                light.position.set(-1, -1, -0.9);
                light.position.multiplyScalar(50);
                light.castShadow = true;
                scene.add(light);
                light = new THREE.AmbientLight(color, .4);
                scene.add(light);
                // raycaster
                raycaster = new THREE.Raycaster();
                // drawer
                this.retain("draw", nx.util.paint(function(now) {
                    benchmark(function(mark) {
                        this.fire("fps", 1000 / (now - timestamp));
                        if (!this.dirty()) {
                            mark("clean");
                            return;
                        }
                        // continue
                        if (this._update(renderer, camera)) {
                            // pick
                            this._raycast(raycaster, camera);
                            // draw current frame
                            renderer.render(scene, camera);
                            fps = fps ? (500 / (now - timestamp) + fps / 2) : (500 / (now - timestamp));
                            timestamp = now;
                            // clear dirty mark
                            mark("dirty");
                            this.dirty(false);
                        }
                    }.bind(this));
                }.bind(this)));

                // update scene property
                this.camera(camera);
                this._scene = new sanvy.Object(scene);
                this._scene.stage(this);
                this.notify("scene");
            },
            add: function(object) {
                this.scene().add(object);
            },
            pick: function(x, y, targets, callback) {
                var point = new THREE.Vector2(x / this.width() * 2 - 1, -y / this.height() * 2 + 1);
                this.pickings().push(new EXPORT.Picking(point, targets, callback));
                this.dirty(true);
            },
            _update: function(renderer, camera) {
                var bound = this.getBound();
                if (bound.width && bound.height) {
                    if (bound.width !== this.width() || bound.height !== this.height()) {
                        this.width(bound.width);
                        this.height(bound.height);
                        // update renderer
                        renderer.setSize(bound.width, bound.height);
                        // update camera
                        camera.updateProjectionMatrix();
                        camera.updateMatrix();
                    }
                    return true;
                }
            },
            _raycast: function(raycaster, camera) {
                nx.each(this.pickings(), function(picking) {
                    raycaster.setFromCamera(picking.point(), camera);
                    var targets = picking.targets();
                    var intersects = raycaster.intersectObjects(targets, true);
                    var object = intersects[0] && intersects[0].object;
                    var target = targets.find(function(target) {
                        var o = object;
                        while (o) {
                            if (o === target) {
                                return true;
                            }
                            o = o.parent;
                        }
                    });
                    try {
                        picking.callback().call(this, target, object);
                    } catch (e) {
                        console.error(e);
                    }
                }.bind(this));
                this.pickings().clear();
            }
        },
        statics: {
            FONTS: FONTS,
            Picking: nx.define({
                properties: {
                    point: null,
                    targets: null,
                    callback: null
                },
                methods: {
                    init: function(point, targets, callback) {
                        this.inherited();
                        this.point(point);
                        this.targets(targets);
                        this.callback(callback);
                    }
                }
            })
        }
    });
})(nx);
