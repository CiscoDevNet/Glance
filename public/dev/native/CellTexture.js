(function (nx) {
    var EXPORT = nx.define("sanvy.ColorShape", {
        properties: {
            sanvy: null,
            vertexBuffer: null,
            colorBuffer: null,
            indexBuffer: null,
            texture: null,
            matrixUniforms: {
                value: function () {
                    return new nx.List();
                }
            },
            program: {
                dependencies: "sanvy,texture,vertexBuffer,colorBuffer,indexBuffer,matrixUniforms.length",
                value: function (sanvy, texture, vertexBuffer, colorBuffer, indexBuffer, numMatrix) {
                    if (sanvy) {
			var context = sanvy.context();
                    }
                }
            }
        },
        methods: {
            init: function (sanvy, data) {
                this.inherited();
                this.sanvy(sanvy);
                // TODO initialize
            },
            draw: function () {
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
                var context = this.context();
		

                mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

                mat4.identity(mvMatrix);

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
        },
        statics: {
            GLSL_TEXTURE: {
                uniform: "uniform sampler2D uSampler;",
                varying: "varying vec2 vTextureCoord;",
                main: {
                    fragment: "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
                    vertex: "vTextureCoord = {name}"
                }
            },
            GLSL_MATRIX: {
                uniform: "uniform mat4 uMatrix{index}"
            }
        }
    });
})(nx);
