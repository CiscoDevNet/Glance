(function(nx) {

    var EXPORT = nx.define("glance.perspective.Mark", sanvy.Object, {
        sanvy: {
            properties: {
                "object.visible": "{model.showLabel}"
            },
            content: [{
                properties: {
                    "object": nx.binding("height", function(height) {
                        var geometry = new THREE.Geometry();
                        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
                        geometry.vertices.push(new THREE.Vector3(0, 0, height * 0.95));
                        geometry.computeLineDistances();
                        var material = new THREE.LineBasicMaterial({
                            color: 0xf10101
                        });
                        return new THREE.Line(geometry, material);
                    })
                }
            }, {
                properties: {
                    "object": nx.binding("height", function(height) {
                        var geometry = new THREE.CircleGeometry(height * 0.05, 16);
                        var material = new THREE.MeshBasicMaterial({
                            color: 0xf10101,
                            side: THREE.DoubleSide
                        });
                        var mesh = new THREE.Mesh(geometry, material);
                        mesh.rotation.z = Math.PI / 2;
                        return mesh;
                    })
                }
            }, {
                name: "markContent",
                properties: {
                    "object.rotation.order": "ZYX",
                    "object.rotation.z": "{rotation}",
                    "object.rotation.x": nx.binding("slop", function(slop) {
                        return Math.PI / 2 + slop;
                    }),
                    "object.position.y": -1,
                    "object.position.z": "{height}"
                }
            }]
        },
        properties: {
            model: null,
            active: false,
            slop: 0,
            rotation: 0,
            size: 0,
            height: 0
        }
    });

})(nx);
