var core = require("../../pixi"),
	ObjectRenderer = require('../../renderers/webgl/utils/ObjectRenderer'),
    CONST = require('../../const');

/**
 * @author Mat Groves
 *
 * Big thanks to the very clever Matt DesLauriers <mattdesl> https://github.com/mattdesl/
 * for creating the original pixi version!
 * Also a thanks to https://github.com/bchevalier for tweaking the tint and alpha so that they now share 4 bytes on the vertex buffer
 *
 * Heavily inspired by LibGDX's SpriteRenderer:
 * https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/SpriteRenderer.java
 */

/**
 *
 * @class
 * @private
 * @namespace PIXI
 * @param renderer {WebGLRenderer} The renderer this sprite batch works for.
 */
function SpriteRenderer(renderer)
{
    ObjectRenderer.call(this, renderer);

    /**
     *
     * X,Y,R,G,B * 4 (byte/element)
     * @member {number}
     */
    this.vertByteSize = 5 * 4;

    /**
     * The number of images in the SpriteBatch before it flushes.
     *
     * @member {number}
     */
    this.size = CONST.SPRITE_BATCH_SIZE; // 2000 is a nice balance between mobile / desktop

    // the total number of bytes in our batch
    var numVerts = this.size * 4 * this.vertByteSize;
    // the total number of indices in our batch
    var numIndices = this.size * 6;

    /**
     * Holds the vertices
     *
     * @member {ArrayBuffer}
     */
    this.vertices = new ArrayBuffer(numVerts);

    /**
     * View on the vertices as a Float32Array
     *
     * @member {Float32Array}
     */
    this.positions = new Float32Array(this.vertices);

    /**
     * View on the vertices as a Uint32Array
     *
     * @member {Uint32Array}
     */
    this.colors = new Uint32Array(this.vertices);

    /**
     * Holds the indices
     *
     * @member {Uint16Array}
     */
    this.indices = new Uint16Array(numIndices);

    /**
     *
     *
     * @member {number}
     */
    this.lastIndexCount = 0;

    for (var i=0, j=0; i < numIndices; i += 6, j += 4)
    {
        this.indices[i + 0] = j + 0;
        this.indices[i + 1] = j + 1;
        this.indices[i + 2] = j + 2;
        this.indices[i + 3] = j + 0;
        this.indices[i + 4] = j + 2;
        this.indices[i + 5] = j + 3;
    }

    /**
     *
     *
     * @member {number}
     */
    this.currentBatchSize = 0;

    /**
     *
     *
     * @member {BaseTexture}
     */
    this.currentBaseTexture = null;

    /**
     *
     *
     * @member {Array}
     */
    this.textures = [];

    /**
     *
     *
     * @member {Array}
     */
    this.blendModes = [];

    /**
     *
     *
     * @member {Array}
     */
    this.sprites = [];

    /**
     * The default shader that is used if a sprite doesn't have a more specific one.
     *
     * @member {Shader}
     */
    this.shader = null;

	this.onContextChange();
}

SpriteRenderer.prototype = Object.create(ObjectRenderer.prototype);
SpriteRenderer.prototype.constructor = SpriteRenderer;
module.exports = SpriteRenderer;

/**
 * Sets up the renderer context and necessary buffers.
 *
 * @private
 * @param gl {WebGLContext} the current WebGL drawing context
 */
SpriteRenderer.prototype.onContextChange = function ()
{
    var gl = core.gl;

    // setup default shader
    this.shader = this.renderer.shaderManager.defaultShader;

    // create a couple of buffers
    this.vertexBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    //upload the index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

    this.currentBlendMode = 99999;
};

/**
 * Renders the sprite object.
 *
 * @param sprite {Sprite} the sprite to render when using this spritebatch
 */
SpriteRenderer.prototype.render = function (sprite)
{
    var texture = sprite._texture;

    if (!texture.baseTexture.source && !texture.baseTexture._glTexture) return;

    //TODO set blend modes..
    // check texture..
    if (this.currentBatchSize >= this.size)
    {
        this.flush();
        this.currentBaseTexture = texture.baseTexture;
    }

    // get the uvs for the texture
    var uvs = texture._uvs;

    // if the uvs have not updated then no point rendering just yet!
    if (!uvs)
    {
        return;
    }

    // TODO trim??
    var aX = sprite.anchor.x,
        aY = sprite.anchor.y;

    var w0, w1, h0, h1;

    if (texture.trim)
    {
        // if the sprite is trimmed then we need to add the extra space before transforming the sprite coords..
        var trim = texture.trim;

        w1 = trim.x - aX * trim.width;
        w0 = w1 + texture.crop.width;

        h1 = trim.y - aY * trim.height;
        h0 = h1 + texture.crop.height;

    }
    else
    {
        w0 = texture._frame.width * (1-aX);
        w1 = texture._frame.width * -aX;

        h0 = texture._frame.height * (1-aY);
        h1 = texture._frame.height * -aY;
    }

    var index = this.currentBatchSize * this.vertByteSize;

    var worldTransform = sprite.worldTransform;

    var a = worldTransform.a,
        b = worldTransform.b,
        c = worldTransform.c,
        d = worldTransform.d,
        tx = worldTransform.tx,
        ty = worldTransform.ty;

    var colors = this.colors,
        positions = this.positions;

	// xy
	positions[index] = a * w1 + c * h1 + tx;
	positions[index+1] = d * h1 + b * w1 + ty;

	positions[index+5] = a * w0 + c * h1 + tx;
	positions[index+6] = d * h1 + b * w0 + ty;

	positions[index+10] = a * w0 + c * h0 + tx;
	positions[index+11] = d * h0 + b * w0 + ty;

	positions[index+15] = a * w1 + c * h0 + tx;
	positions[index+16] = d * h0 + b * w1 + ty;

    // uv
    positions[index+2] = uvs.x0;
    positions[index+3] = uvs.y0;

    positions[index+7] = uvs.x1;
    positions[index+8] = uvs.y1;

    positions[index+12] = uvs.x2;
    positions[index+13] = uvs.y2;

    positions[index+17] = uvs.x3;
    positions[index+18] = uvs.y3;

    // color and alpha
    var tint = sprite.tint;
    colors[index+4] = colors[index+9] = colors[index+14] = colors[index+19] = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) + (sprite.worldAlpha * 255 << 24);

    // increment the batchsize
    this.sprites[this.currentBatchSize++] = sprite;
};

/**
 * Renders the content and empties the current batch.
 *
 */
SpriteRenderer.prototype.flush = function ()
{
    // If the batch is length 0 then return as there is nothing to draw
    if (this.currentBatchSize === 0)
    {
        return;
    }

    var gl = core.gl;

    // upload the verts to the buffer
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.currentBatchSize * 2 > this.size ?
        this.vertices : this.positions.subarray(0, this.currentBatchSize * this.vertByteSize));

    var start = 0;

    var currentBaseTexture = null;
    var currentBlendMode = this.renderer.blendModeManager.currentBlendMode;
    var currentShader = this.renderer.shaderManager.currentShader;
	var uniformDirty = true;

    for (var i = 0, j = this.currentBatchSize; i < j; i++)
    {
        var sprite = this.sprites[i];

        var nextTexture = sprite._texture.baseTexture;

        var nextBlendMode = sprite.blendMode;
        var nextShader = sprite.shader || this.shader;

        var blendSwap = currentBlendMode !== nextBlendMode;
        var shaderSwap = currentShader !== nextShader || uniformDirty;

        if (currentBaseTexture !== nextTexture || blendSwap || shaderSwap)
        {
            this.renderBatch(currentBaseTexture, i - start, start);

            start = i;
            currentBaseTexture = nextTexture;

            if (blendSwap)
            {
                currentBlendMode = nextBlendMode;
                this.renderer.blendModeManager.setBlendMode( currentBlendMode );
            }

            if (shaderSwap && (this.renderer.shaderManager.setShader(nextShader) || uniformDirty)){
				uniformDirty = false;
				currentShader = nextShader;
				// both these only need to be set if they are changing..
				// set the projection
				gl.uniformMatrix3fv(currentShader.uniforms.projectionMatrix._location, false, this.renderer.currentRenderTarget.projectionMatrix.toArray(true));
            }
        }
    }

    this.renderBatch(currentBaseTexture, this.currentBatchSize - start, start);

    // then reset the batch!
    this.currentBatchSize = 0;
};

/**
 * Draws the currently batches sprites.
 *
 * @private
 * @param texture {Texture}
 * @param size {number}
 * @param startIndex {number}
 */
SpriteRenderer.prototype.renderBatch = function (texture, size, startIndex)
{
    if (size === 0)
    {
        return;
    }

    var gl = core.gl;

    if (!texture._glTexture)
    {
        this.renderer.updateTexture(texture);
    }
    else
    {
        // bind the current texture
        gl.bindTexture(gl.TEXTURE_2D, texture._glTexture);
    }

    // now draw those suckas!
    gl.drawElements(gl.TRIANGLES, size * 6, gl.UNSIGNED_SHORT, startIndex * 6 * 2);
};

/**
 * Starts a new sprite batch.
 *
 */
SpriteRenderer.prototype.start = function ()
{
    var gl = core.gl;

    // bind the main texture
    gl.activeTexture(gl.TEXTURE0);

    // bind the buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // this is the same for each shader?
    var stride =  this.vertByteSize;
    gl.vertexAttribPointer(this.shader.attributes.aVertexPosition, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(this.shader.attributes.aTextureCoord, 2, gl.FLOAT, false, stride, 2 * 4);

    // color attributes will be interpreted as unsigned bytes and normalized
    gl.vertexAttribPointer(this.shader.attributes.aColor, 4, gl.UNSIGNED_BYTE, true, stride, 4 * 4);
};

/**
 * Destroys the SpriteBatch.
 *
 */
SpriteRenderer.prototype.destroy = function ()
{
    core.gl.deleteBuffer(this.vertexBuffer);
    core.gl.deleteBuffer(this.indexBuffer);

    this.shader.destroy();

    this.renderer = null;

    this.vertices = null;
    this.positions = null;
    this.colors = null;
    this.indices = null;

    this.vertexBuffer = null;
    this.indexBuffer = null;

    this.currentBaseTexture = null;

    this.textures = null;
    this.blendModes = null;
    this.sprites = null;
    this.shader = null;
};
