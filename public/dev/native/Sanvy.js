(function (nx) {
    var EXPORT = nx.define("sanvy.Sanvy", nx.ui.tag.Canvas, {
        properties: {
            context: null,
            shapes: {
                value: function () {
                    return new sanvy.model.SanvyModel();
                }
            },
            shaderPrograms: {
                dependencies: "context,model",
                async: true,
                value: function (property, context, model) {
                    if (context && model) {
                        this.release("shaderPrograms");
                        var map = property.get() || property.set(new nx.Map());
                        var resources = new nx.Object();

                    }
                }
            },
            dirty: {
                dependencies: "models",
                async: true,
                value: function (property, models) {
                    //
                },
                watcher: function (pname, pvalue) {
                    // 
                }
            }
        },
        methods: {
            init: function () {
                this.inherited();
                this.context(this.dom().getContext("experimental-webgl"));
            },
            createBufferColor: function (vertices, colors) {

            },
            createBufferColorIndexed: function (vertices, colors, indices) {

            },
            createBufferTexture: function (vertices, texture, coordinates) {

            },
            createBufferTextureIndexed: function (vertices, texture, coordinates, indices) {
		
            },
            createCell: function (buffer, matrices) {
		
            },
            draw: function () {
                var context = this.context();
                gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

                mat4.identity(mvMatrix);

                mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
                gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                setMatrixUniforms();
                gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

                mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);
                gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                setMatrixUniforms();
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
            }
        }
    });
})(nx);
