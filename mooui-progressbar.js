/**
 * user: lobos841@gmail.com
 * date: 12-11-22 上午9:06
 * license: MIT-style
 */

(function () {

if (!this.MooUI) this.MooUI = {};

MooUI.ProgressBar = new Class({
    Implements: [Options, Events],

    options: {
        barClass: 'bar'
    },

    initialize: function (element, options) {
        this.setOptions(options);
        this.container = document.id(element);
        this.bar = new Element('div', {'class': this.options.barClass}).inject(this.container);
        this.bar.set('morph', {
            unit: '%',
            transition: Fx.Transitions.linear,
            onComplete: function () {
                var width = this.bar.getStyle('width');
                if (width == '100%')
                    this.fireEvent('complete');
            }.bind(this)
        });
    },

    set: function (to) {
        this.bar.setStyle('width', to + "%");
        return this;
    },

    start: function (to, total) {
        if (total) to = to / total * 100;
        to = to > 100 ? 100 : to;
        this.bar.morph({ width: to });
        return this;
    },

    imitation: function (total) {
        var i = 0,
            p = function () {
                i += 1;
                if (i <= total) {
                    this.start(i, total);
                    setTimeout(p, 100);
                }
            }.bind(this);
        setTimeout(p, 100);

        return this;
    }

});

})();