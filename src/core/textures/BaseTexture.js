var utils = require('../utils'),
    CONST = require('../const');

/**
 * A texture stores the information that represents an image. All textures have a base texture.
 *
 * @class
 * @mixes eventTarget
 * @namespace PIXI
 * @param source {Image|Canvas} the source object of the texture.
 * @param [scaleMode=scaleModes.DEFAULT] {number} See {@link scaleModes} for possible values
 */
function BaseTexture(source, scaleMode)
{
    /**
     * The width of the base texture set when the image has loaded
     *
     * @member {number}
     * @readOnly
     */
    this.width = this.source.naturalWidth || this.source.width;

    /**
     * The height of the base texture set when the image has loaded
     *
     * @member {number}
     * @readOnly
     */
    this.height = this.source.naturalHeight || this.source.height;

    /**
     * The scale mode to apply when scaling this texture
     *
     * @member {{number}}
     * @default scaleModes.LINEAR
     */
    this.scaleMode = scaleMode || CONST.scaleModes.DEFAULT;

    /**
     * The image source that is used to create the texture.
     *
     * @member {Image|Canvas}
     * @readonly
     */
    this.source = source;

    /**
     * Controls if RGB channels should be pre-multiplied by Alpha  (WebGL only)
     *
     * @member {boolean}
     * @default true
     */
    this.premultipliedAlpha = true;

    /**
     * @member {boolean}
     * @private
     */
    this.isPowerOfTwo = utils.isPowerOfTwo(this.width, this.height);

    // used for webGL

    /**
     *
     * Set this to true if a mipmap of this texture needs to be generated. This value needs to be set before the texture is used
     * Also the texture must be a power of two size to work
     *
     * @member {boolean}
     */
    this.mipmap = false;

    /**
     * webgl texture
     *
     * @member WebGLTexture
     * @private
     */
    this._glTexture = null;
}

BaseTexture.prototype.constructor = BaseTexture;
module.exports = BaseTexture;

/**
 * Destroys this base texture
 *
 */
BaseTexture.prototype.destroy = function (renderer)
{
    this.source = null;
	if (renderer && renderer.gl && this._glTexture) {
		renderer.gl.deleteTexture(this._glTexture);
		this._glTexture = null;
	}
};