(function(nx) {
    var EXPORT = nx.define("sanvy.Mesh", sanvy.Object, {
        methods: {
            init: function(stage, object3d) {
                var mesh, self = this;
                if (!(object3d instanceof THREE.Mesh)) {
                    mesh = new THREE.Mesh();
                }
                this.inherited(object3d || mesh);
                if (mesh) {
                    this.retain("init", {
                        release: function() {
                            if (self.object() === mesh) {
                                self.object(null);
                            }
                        }
                    });
                }
            }
        }
    });
})(nx);
