/**
 * @file        Main export of the PIXI core library
 * @author      Mat Groves <mat@goodboydigital.com>
 * @copyright   2013-2015 GoodBoyDigital
 * @license     {@link https://github.com/GoodBoyDigital/pixi.js/blob/master/LICENSE|MIT License}
 */

/**
 * @namespace PIXI
 */
exports.CONST = require('./const');

// utils
exports.utils = require('./utils/index');
exports.math = require('./math/index');

// display
exports.Container = require('./display/Container');

// sprites
exports.Sprite=                require('./sprites/Sprite');
exports.SpriteRenderer=        require('./sprites/webgl/SpriteRenderer');

// primitives
exports.Graphics=              require('./graphics/Graphics');
exports.GraphicsData=          require('./graphics/GraphicsData');
exports.GraphicsRenderer=      require('./graphics/webgl/GraphicsRenderer');

// textures
exports.Texture=               require('./textures/Texture');
exports.BaseTexture=           require('./textures/BaseTexture');
exports.RenderTexture=         require('./textures/RenderTexture');

// renderers - canvas
exports.CanvasRenderer=        require('./renderers/canvas/CanvasRenderer');
exports.CanvasGraphics=        require('./renderers/canvas/utils/CanvasGraphics');
exports.CanvasBuffer=          require('./renderers/canvas/utils/CanvasBuffer');

// renderers - webgl
exports.WebGLRenderer=         require('./renderers/webgl/WebGLRenderer');
exports.ShaderManager=         require('./renderers/webgl/managers/ShaderManager');
exports.Shader=                require('./renderers/webgl/shaders/Shader');
exports.TextureShader=         require('./renderers/webgl/shaders/TextureShader');
exports.gl = null;

exports.autoDetectRenderer = function(width, height, options){
	return new (options.view.getContext("webgl") ? exports.WebGLRenderer : exports.CanvasRenderer)(width, height, options);
}