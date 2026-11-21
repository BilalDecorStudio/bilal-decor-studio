/**
 * Bilal Decor Studio - Clean Interactive Controller (3D Animations Disabled)
 * Replaced heavy 3D parallax tilts and wobbles with clean, fast, professional UI states.
 */

const Tilt3D = {
    init() {
        // 3D animations and tilts are permanently disabled per user preference
    },

    bindCardTilt() {
        // No-op: cards remain flat and stable without 3D tilting on mouse move
    },

    init3DMarqueePreview() {
        // No-op: clean 2D layout without 3D perspective distortion
    }
};

window.Tilt3D = Tilt3D;

document.addEventListener('DOMContentLoaded', () => {
    Tilt3D.init();
});
