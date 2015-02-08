/**
 * @namespace PIXI.math
 */
module.exports = {
    /**
     * @property {number} PI_2 - Math.PI x 2
     * @constant
     * @static
     */
    PI_2: Math.PI * 2,

    Point:      require('./Point'),
    Matrix:     require('./Matrix'),

    Polygon:    require('./shapes/Polygon'),
    Rectangle:  require('./shapes/Rectangle'),
};
