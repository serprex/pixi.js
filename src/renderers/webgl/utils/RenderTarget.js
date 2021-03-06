var core = require("../../../pixi"),
    math = require('../../../math'),
    CONST = require('../../../const'),
    StencilMaskStack = require('./StencilMaskStack');

/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 */

/**
* @class FrameBuffer
* @constructor
* @param gl {WebGLContext} the current WebGL drawing context
* @param width {Number} the horizontal range of the filter
* @param height {Number} the vertical range of the filter
* @param scaleMode {Number} See {{#crossLink "PIXI/scaleModes:property"}}PIXI.scaleModes{{/crossLink}} for possible values
*/
var RenderTarget = function(width, height, scaleMode, root, createStencilBuffer)
{
    var gl = core.gl;

    // next time to create a frame buffer and texture

    /**
     * @property frameBuffer
     * @type Any
     */
    this.frameBuffer = null;

    /**
     * @property texture
     * @type Any
     */
    this.texture = null;

    this.size = new math.Rectangle(0, 0, 1, 1);

    this.projectionMatrix = new math.Matrix();

    this.frame = null;

    this.stencilBuffer = null;
    this.stencilMaskStack = new StencilMaskStack();

    /**
     * @property scaleMode
     * @type Number
     */
    this.scaleMode = scaleMode || CONST.scaleModes.DEFAULT;

    this.root = root;

    if (!this.root)
    {
       // this.flipY = true;
        this.frameBuffer = gl.createFramebuffer();

        /*
            A frame buffer needs a target to render to..
            create a texture and bind it attach it to the framebuffer..
         */

        this.texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D,  this.texture);

        // set the scale properties of the texture..
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, scaleMode === CONST.scaleModes.LINEAR ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, scaleMode === CONST.scaleModes.LINEAR ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer );
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    }


    this.resize(width, height);

    if (createStencilBuffer)
    {
        this.attachStenilBuffer();
    }


};

RenderTarget.prototype.constructor = RenderTarget;
module.exports = RenderTarget;

/**
* Clears the filter texture.
*
* @method clear
*/
RenderTarget.prototype.clear = function()
{
    var gl = core.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

RenderTarget.prototype.attachStenilBuffer = function()
{

    if ( this.stencilBuffer )
    {
        return;
    }

    /*
        The stencil buffer is used for masking in pixi
        lets create one and then add attach it to the framebuffer..
     */
    if (!this.root)
    {
        var gl = core.gl;

        this.stencilBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.stencilBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,  this.width  , this.height );
    }
};

RenderTarget.prototype.activate = function()
{
    //TOOD refactor usage of frame..
    var gl = core.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

    var projectionFrame = this.frame || this.size;

    // TODO add a dirty flag to this of a setter for the frame?
    this.calculateProjection( projectionFrame );

    gl.viewport(0,0, projectionFrame.width, projectionFrame.height);
};

RenderTarget.prototype.calculateProjection = function( projectionFrame )
{
    var pm = this.projectionMatrix;

    pm.identity();

    if (!this.root)
    {
        pm.a = 2 / projectionFrame.width;
        pm.d = 2 / projectionFrame.height;

        pm.tx = -1 - projectionFrame.x * pm.a;
        pm.ty = -1 - projectionFrame.y * pm.d;
    }
    else
    {
        pm.a = 2 / projectionFrame.width;
        pm.d = -2 / projectionFrame.height;

        pm.tx = -1 - projectionFrame.x * pm.a;
        pm.ty = 1 - projectionFrame.y * pm.d;
    }
};


/**
 * Resizes the texture to the specified width and height
 *
 * @method resize
 * @param width {Number} the new width of the texture
 * @param height {Number} the new height of the texture
 */
RenderTarget.prototype.resize = function(width, height)
{
    width = width | 0;
    height = height | 0;

    if (this.size.width === width && this.size.height === height) {
        return;
    }

    this.size.width = width;
    this.size.height = height;

    if (!this.root)
    {
        var gl = core.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  width , height , 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        if (this.stencilBuffer)
        {
            // update the stencil buffer width and height
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
        }
    }

    var projectionFrame = this.frame || this.size;

    this.calculateProjection( projectionFrame );
};

/**
* Destroys the filter texture.
*
* @method destroy
*/
RenderTarget.prototype.destroy = function()
{
    var gl = core.gl;
    gl.deleteFramebuffer( this.frameBuffer );
    gl.deleteTexture( this.texture );

    this.frameBuffer = null;
    this.texture = null;
};
