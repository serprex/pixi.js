var BaseTexture = require('./BaseTexture'),
    TextureUvs = require('./TextureUvs'),
    math = require('../math/index');

/**
 * A texture stores the information that represents an image or part of an image. It cannot be added
 * to the display list directly. Instead use it as the texture for a Sprite. If no frame is provided then the whole image is used.
 *
 * @class
 * @namespace PIXI
 * @param baseTexture {BaseTexture} The base texture source to create the texture from
 * @param [frame] {Rectangle} The rectangle frame of the texture to show
 * @param [crop] {Rectangle} The area of original texture
 * @param [trim] {Rectangle} Trimmed texture rectangle
 */
function Texture(baseTexture, frame, crop, trim)
{
	if (baseTexture instanceof Texture)
    {
        baseTexture = baseTexture.baseTexture;
    }

	if (!frame)
	{
		frame = new math.Rectangle(0, 0, baseTexture.width, baseTexture.height);
	}

    /**
     * The base texture that this texture uses.
     *
     * @member {BaseTexture}
     */
    this.baseTexture = baseTexture;

    /**
     * This will let the renderer know if the texture is valid. If it's not then it cannot be rendered.
     *
     * @member {boolean}
     */
    this.valid = false;

    /**
     * The width of the Texture in pixels.
     *
     * @member {number}
     */
    this.width = 0;

    /**
     * The height of the Texture in pixels.
     *
     * @member {number}
     */
    this.height = 0;

	/**
     * The rotation value of the texture.
     *
     * @private
     * @member {number}
     */
    this._rotation = 0;

	/**
     * The WebGL UV data cache.
     *
     * @member {object}
     * @private
     */
    this._uvs = new TextureUvs();

    /**
     * The texture trim data.
     *
     * @member {Rectangle}
     */
    this.trim = trim;

    /**
     * This is the area of the BaseTexture image to actually copy to the Canvas / WebGL when rendering,
     * irrespective of the actual frame size or placement (which can be influenced by trimmed texture atlases)
     *
     * @member {Rectangle}
     */
    this.crop = crop || frame;

    /**
     * Does this Texture have any frame data assigned to it?
     *
     * @member {boolean}
     */
	this.frame = frame;
}

Texture.prototype.constructor = Texture;
module.exports = Texture;

Object.defineProperties(Texture.prototype, {
    frame: {
        get: function ()
        {
            return this._frame;
        },
        set: function (frame)
        {
            this._frame = frame;


            this.width = frame.width;
            this.height = frame.height;

            this.crop = frame;

            if (!this.trim && (frame.x + frame.width > this.baseTexture.width || frame.y + frame.height > this.baseTexture.height))
            {
                throw new Error('Texture Error: frame does not fit inside the base Texture dimensions ' + this);
            }

            this.valid = frame && frame.width && frame.height;

            if (this.trim)
            {
                this.width = this._frame.width = this.trim.width;
                this.height = this._frame.height = this.trim.height;
            }

            if (this.valid)
            {
                this._updateUvs();
            }
        }
    },
    rotation: {
        get: function ()
        {
            return this._rotation;
        },
        set: function (val) {
            this._rotation = val;

            this._updateUvs();
        }
    }
});

/**
 * Destroys this texture
 *
 * @param destroyBase {boolean} Whether to destroy the base texture as well
 */
Texture.prototype.destroy = function (destroyBase)
{
    if (destroyBase)
    {
        this.baseTexture.destroy();
    }

    this.valid = false;
};

/**
 * Updates the internal WebGL UV cache.
 *
 * @private
 */
Texture.prototype._updateUvs = function ()
{
    if (!this._uvs)
    {
        this._uvs = new TextureUvs();
    }

    var frame = this.crop;
    var tw = this.baseTexture.width;
    var th = this.baseTexture.height;

    this._uvs.x0 = frame.x / tw;
    this._uvs.y0 = frame.y / th;

    this._uvs.x1 = (frame.x + frame.width) / tw;
    this._uvs.y1 = frame.y / th;

    this._uvs.x2 = (frame.x + frame.width) / tw;
    this._uvs.y2 = (frame.y + frame.height) / th;

    this._uvs.x3 = frame.x / tw;
    this._uvs.y3 = (frame.y + frame.height) / th;

    this._uvs.rotate(this.rotation);
};

Texture.emptyTexture = new Texture(new BaseTexture());
