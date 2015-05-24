/**
 * @class
 * @private
 * @namespace PIXI
 * @param renderer {WebGLRenderer} The renderer this object renderer works for.
 */
function ObjectRenderer(renderer)
{
	this.renderer = renderer;
}

ObjectRenderer.prototype.constructor = ObjectRenderer;
module.exports = ObjectRenderer;

ObjectRenderer.prototype.start = function ()
{
    // set the shader..
};

ObjectRenderer.prototype.stop = function ()
{
    this.flush();
};

ObjectRenderer.prototype.flush = function ()
{
    // flush!
};

ObjectRenderer.prototype.render = function (/* object */)
{
    // render the object
};