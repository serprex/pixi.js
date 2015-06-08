var core = require("../../index");
/**
 * @class
 * @private
 */
function WebGLGraphicsData() {
    this.color = new Float32Array(3);
    this.points = [];
    this.indices = [];
    this.buffer = core.gl.createBuffer();
    this.indexBuffer = core.gl.createBuffer();
    this.mode = 1;
    this.alpha = 1;
    this.dirty = true;
	this.glPoints = null;
	this.glIndicies = null;
}

WebGLGraphicsData.prototype.constructor = WebGLGraphicsData;
module.exports = WebGLGraphicsData;

/**
 *
 */
WebGLGraphicsData.prototype.reset = function () {
    this.points.length = 0;
    this.indices.length = 0;
};

/**
 *
 */
WebGLGraphicsData.prototype.upload = function () {
    var gl = core.gl;

//    this.lastIndex = graphics.graphicsData.length;
    this.glPoints = new Float32Array(this.points);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.glPoints, gl.STATIC_DRAW);

    this.glIndicies = new Uint16Array(this.indices);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.glIndicies, gl.STATIC_DRAW);

    this.dirty = false;
};
