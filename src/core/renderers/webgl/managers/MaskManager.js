var WebGLManager = require('./WebGLManager');

/**
 * @class
 * @namespace PIXI
 * @param renderer {WebGLRenderer} The renderer this manager works for.
 */
function MaskManager(renderer)
{
    WebGLManager.call(this, renderer);

    this.stencilStack = [];
    this.reverse = true;
    this.count = 0;
}

MaskManager.prototype = Object.create(WebGLManager.prototype);
MaskManager.prototype.constructor = MaskManager;
module.exports = MaskManager;

/**
 * Applies the Mask and adds it to the current filter stack.
 *
 * @param graphics {Graphics}
 * @param webGLData {any[]}
 */
MaskManager.prototype.pushMask = function (target, maskData)
{
	this.pushStencilMask(target, maskData);
};

MaskManager.prototype.popMask = function (target, maskData)
{
    if (maskData.texture)
    {
        this.popSpriteMask(target, maskData);
    }
    else
    {
        this.popStencilMask(target, maskData);
    }
};

/**
 * Applies the Mask and adds it to the current filter stack.
 *
 * @param maskData {any[]}
 */

MaskManager.prototype.pushStencilMask = function (target, maskData)
{
    this.renderer.currentRenderTarget.attachStenilBuffer();
    this.renderer.stencilManager.pushMask(maskData);
};

/**
 * Removes the last filter from the filter stack and doesn't return it.
 *
 * @param maskData {any[]}
 */
MaskManager.prototype.popStencilMask = function (target, maskData)
{
    this.renderer.stencilManager.popMask(maskData);
};

