var CanvasGraphics = require('./CanvasGraphics');

/**
 * A set of functions used to handle masking.
 *
 * @class
 * @namespace PIXI
 */
function CanvasMaskManager()
{}

CanvasMaskManager.prototype.constructor = CanvasMaskManager;
module.exports = CanvasMaskManager;

/**
 * This method adds it to the current stack of masks.
 *
 * @param maskData {object} the maskData that will be pushed
 * @param renderer {WebGLRenderer|CanvasRenderer} The renderer context to use.
 */
CanvasMaskManager.prototype.pushMask = function (maskData, renderer)
{
    renderer.context.save();

    var cacheAlpha = maskData.alpha;
    var transform = maskData.worldTransform;

    renderer.context.setTransform(
        transform.a,
        transform.b,
        transform.c,
        transform.d,
        transform.tx,
        transform.ty
    );

    CanvasGraphics.renderGraphicsMask(maskData, renderer.context);

    renderer.context.clip();

    maskData.worldAlpha = cacheAlpha;
};

/**
 * Restores the current drawing context to the state it was before the mask was applied.
 *
 * @param renderer {WebGLRenderer|CanvasRenderer} The renderer context to use.
 */
CanvasMaskManager.prototype.popMask = function (renderer)
{
    renderer.context.restore();
};
