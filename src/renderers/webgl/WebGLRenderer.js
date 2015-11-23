var core = require("../../pixi"),
    SystemRenderer = require('../SystemRenderer'),
    ShaderManager = require('./managers/ShaderManager'),
    MaskManager = require('./managers/MaskManager'),
    StencilManager = require('./managers/StencilManager'),
    BlendModeManager = require('./managers/BlendModeManager'),
    RenderTarget = require('./utils/RenderTarget'),
    ObjectRenderer = require('./utils/ObjectRenderer'),
	GraphicsRenderer = require("../../graphics/webgl/GraphicsRenderer"),
	SpriteRenderer = require("../../sprites/webgl/SpriteRenderer"),
    CONST = require('../../const');

/**
 * The WebGLRenderer draws the scene and all its content onto a webGL enabled canvas. This renderer
 * should be used for browsers that support webGL. This Render works by automatically managing webGLBatchs.
 * So no need for Sprite Batches or Sprite Clouds.
 * Don't forget to add the view to your DOM or you will not see anything :)
 *
 * @class
 * @namespace PIXI
 * @param [width=0] {number} the width of the canvas view
 * @param [height=0] {number} the height of the canvas view
 * @param [options] {object} The optional renderer parameters
 * @param [options.view] {HTMLCanvasElement} the canvas to use as a view, optional
 * @param [options.clearBeforeRender=true] {boolean} This sets if the CanvasRenderer will clear the canvas or
 *      not before the new render pass.
 * @param [options.preserveDrawingBuffer=false] {boolean} enables drawing buffer preservation, enable this if
 *      you need to call toDataUrl on the webgl context.
 */
function WebGLRenderer(width, height, options)
{
    options = options || {};

    SystemRenderer.call(this, 'WebGL', width, height, options);

    this.type = CONST.RENDERER_TYPE.WEBGL;

    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);

    this.view.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.view.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    /**
     * The options passed in to create a new webgl context.
     *
     * @member {object}
     * @private
     */
    this._contextOptions = {
        alpha: true,
        premultipliedAlpha: false,
        stencil: true,
        preserveDrawingBuffer: options.preserveDrawingBuffer
    };

     // initialize the context so it is ready for the managers.
    this._initContext();

    /**
     * Deals with managing the shader programs and their attribs.
     *
     * @member {ShaderManager}
     */
    this.shaderManager = new ShaderManager(this);

    /**
     * Manages the masks using the stencil buffer.
     *
     * @member {MaskManager}
     */
    this.maskManager = new MaskManager(this);

    /**
     * Manages the stencil buffer.
     *
     * @member {StencilManager}
     */
    this.stencilManager = new StencilManager(this);

    /**
     * Manages the blendModes
     * @member {BlendModeManager}
     */
    this.blendModeManager = new BlendModeManager(this);

    this.currentRenderTarget = this.renderTarget;


    this.currentRenderer = new ObjectRenderer(this);

	this.GraphicsRenderer = new GraphicsRenderer(this);
	this.SpriteRenderer = new SpriteRenderer(this);

    // map some webGL blend modes..
    this._mapBlendModes();
}

// constructor
WebGLRenderer.prototype = Object.create(SystemRenderer.prototype);
WebGLRenderer.prototype.constructor = WebGLRenderer;
module.exports = WebGLRenderer;

/**
 *
 * @private
 */
WebGLRenderer.prototype._initContext = function ()
{
    var gl = this.view.getContext('webgl', this._contextOptions) || this.view.getContext('experimental-webgl', this._contextOptions);
    core.gl = gl;

    if (!gl)
    {
        // fail, not able to get a context
        throw new Error('This browser does not support webGL. Try using the canvas renderer');
    }

    // set up the default pixi settings..
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);

    this.renderTarget = new RenderTarget(this.width, this.height, null, true);

    // setup the width/height properties and gl viewport
    this.resize(this.width, this.height);
};

/**
 * Renders the object to its webGL view
 *
 * @param object {DisplayObject} the object to be rendered
 */
WebGLRenderer.prototype.render = function (object)
{
    var gl = core.gl;
    // no point rendering if our context has been blown up!
    if (gl.isContextLost())
    {
        return;
    }

    var cacheParent = object.parent;
    object.parent = this._tempDisplayObjectParent;

    // update the scene graph
    object.updateTransform();

    object.parent = cacheParent;

    if (this.clearBeforeRender)
    {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    this.renderDisplayObject(object, this.renderTarget);
};

/**
 * Renders a Display Object.
 *
 * @param displayObject {DisplayObject} The DisplayObject to render
 * @param projection {Point} The projection
 * @param buffer {Array} a standard WebGL buffer
 */
WebGLRenderer.prototype.renderDisplayObject = function (displayObject, renderTarget)
{
    this.blendModeManager.setBlendMode(CONST.blendModes.NORMAL);

    this.setRenderTarget(renderTarget);

    // render the scene!
    displayObject.renderWebGL(this);

    // finish the sprite batch
    this.currentRenderer.flush();

};

WebGLRenderer.prototype.setObjectRenderer = function (objectRenderer)
{
    if (this.currentRenderer === objectRenderer)
    {
        return;
    }

    this.currentRenderer.stop();
    this.currentRenderer = objectRenderer;
    this.currentRenderer.start();
};

WebGLRenderer.prototype.setRenderTarget = function (renderTarget)
{
    if (this.currentRenderTarget === renderTarget)
    {
        return;
    }
    this.currentRenderTarget = renderTarget;
    this.currentRenderTarget.activate();
    this.stencilManager.setMaskStack( renderTarget.stencilMaskStack );
};

/**
 * Resizes the webGL view to the specified width and height.
 *
 * @param width {number} the new width of the webGL view
 * @param height {number} the new height of the webGL view
 */
WebGLRenderer.prototype.resize = function (width, height)
{
    SystemRenderer.prototype.resize.call(this, width, height);

    core.gl.viewport(0, 0, this.width, this.height);

    this.renderTarget.resize(width, height);
};

/**
 * Updates and/or Creates a WebGL texture for the renderer's context.
 *
 * @param texture {BaseTexture|Texture} the texture to update
 */
WebGLRenderer.prototype.updateTexture = function (texture)
{
    texture = texture.baseTexture || texture;

    if (!texture.source)
    {
        return;
    }

    var gl = core.gl;

    if (!texture._glTexture)
    {
        texture._glTexture = gl.createTexture();
    }


    gl.bindTexture(gl.TEXTURE_2D, texture._glTexture);

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultipliedAlpha);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);
	texture.source = null;

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.scaleMode === CONST.scaleModes.LINEAR ? gl.LINEAR : gl.NEAREST);


    if (texture.mipmap && texture.isPowerOfTwo)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === CONST.scaleModes.LINEAR ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.scaleMode === CONST.scaleModes.LINEAR ? gl.LINEAR : gl.NEAREST);
    }

	var clamp = texture.isPowerOfTwo ? gl.REPEAT : gl.CLAMP_TO_EDGE;
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clamp);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clamp);
};

/**
 * Handles a lost webgl context
 *
 * @param event {Event}
 * @private
 */
WebGLRenderer.prototype.handleContextLost = function (event)
{
    event.preventDefault();
};

/**
 * Handles a restored webgl context
 *
 * @param event {Event}
 * @private
 */
WebGLRenderer.prototype.handleContextRestored = function ()
{
    this._initContext();
};

/**
 * Removes everything from the renderer (event listeners, spritebatch, etc...)
 *
 * @param [removeView=false] {boolean} Removes the Canvas element from the DOM.
 */
WebGLRenderer.prototype.destroy = function (removeView)
{
	this.GraphicsRenderer.destroy();
	this.SpriteRenderer.destroy();

    // remove listeners
    this.view.removeEventListener('webglcontextlost', this.handleContextLost);
    this.view.removeEventListener('webglcontextrestored', this.handleContextRestored);

    // call base destroy
    SystemRenderer.prototype.destroy.call(this, removeView);

    // destroy the managers
    this.shaderManager.destroy();
    this.maskManager.destroy();
    this.stencilManager.destroy();

    this.shaderManager = null;
    this.maskManager = null;
    this.blendModeManager = null;

    this.handleContextLost = null;
    this.handleContextRestored = null;

    this._contextOptions = null;
};

/**
 * Maps Pixi blend modes to WebGL blend modes.
 *
 * @private
 */
WebGLRenderer.prototype._mapBlendModes = function ()
{
    var gl = core.gl;

    if (!this.blendModes)
    {
        this.blendModes = {};

        this.blendModes[CONST.blendModes.NORMAL]        = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.ADD]           = [gl.SRC_ALPHA, gl.DST_ALPHA];
        this.blendModes[CONST.blendModes.MULTIPLY]      = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.SCREEN]        = [gl.SRC_ALPHA, gl.ONE];
        this.blendModes[CONST.blendModes.OVERLAY]       = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.DARKEN]        = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.LIGHTEN]       = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.COLOR_DODGE]   = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.COLOR_BURN]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.HARD_LIGHT]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.SOFT_LIGHT]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.DIFFERENCE]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.EXCLUSION]     = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.HUE]           = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.SATURATION]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.COLOR]         = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
        this.blendModes[CONST.blendModes.LUMINOSITY]    = [gl.ONE,       gl.ONE_MINUS_SRC_ALPHA];
    }
};
