var core = require("../../../pixi"),
    TextureShader = require('../shaders/TextureShader'),
    ComplexPrimitiveShader = require('../shaders/ComplexPrimitiveShader'),
    PrimitiveShader = require('../shaders/PrimitiveShader');

/**
 * @class
 * @namespace PIXI
 * @param renderer {WebGLRenderer} The renderer this manager works for.
 */
function ShaderManager(renderer)
{
	this.renderer = renderer;

    /**
     * @member {any[]}
     */
    this.attribState = [false, false, false, false, false, false, false, false, false];

    /**
     * @member {any[]}
     */
    this.tempAttribState = [];


    /**
     * @member {any[]}
     */
    this.stack = [];

    /**
     * @member {number}
     * @private
     */
    this._currentId = -1;

    /**
     * @member {Shader}
     * @private
     */
    this.currentShader = null;

	this.onContextChange();

}

ShaderManager.prototype.constructor = ShaderManager;
module.exports = ShaderManager;

ShaderManager.prototype.onContextChange = function ()
{
    this.defaultShader = new TextureShader(this);
    this.primitiveShader = new PrimitiveShader(this);
    this.complexPrimitiveShader = new ComplexPrimitiveShader(this);
};

/**
 * Takes the attributes given in parameters.
 *
 * @param attribs {Array} attribs
 */
ShaderManager.prototype.setAttribs = function (attribs)
{
    // reset temp state
    var i;

    for (i = 0; i < this.tempAttribState.length; i++)
    {
        this.tempAttribState[i] = false;
    }

    // set the new attribs
    for (var a in attribs)
    {
        this.tempAttribState[attribs[a]] = true;
    }

    var gl = core.gl;

    for (i = 0; i < this.attribState.length; i++)
    {
        if (this.attribState[i] !== this.tempAttribState[i])
        {
            this.attribState[i] = this.tempAttribState[i];

            if (this.attribState[i])
            {
                gl.enableVertexAttribArray(i);
            }
            else
            {
                gl.disableVertexAttribArray(i);
            }
        }
    }
};

/**
 * Sets the current shader.
 *
 * @param shader {Any}
 */
ShaderManager.prototype.setShader = function (shader)
{
    if (this.currentShader === shader)
    {
        return false;
    }

    this.currentShader = shader;

    core.gl.useProgram(shader.program);
    this.setAttribs(shader.attributes);

    return true;
};

/**
 * Destroys this object.
 *
 */
ShaderManager.prototype.destroy = function ()
{
    this.defaultShader.destroy();
    this.primitiveShader.destroy();
    this.complexPrimitiveShader.destroy();
    this.attribState = null;
    this.tempAttribState = null;
	this.renderer = null;
};
