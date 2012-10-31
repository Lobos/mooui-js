/**
* Created by .
* User: lobos841@gmail.com
* Date: 9/13/11
* Time: 11:38 PM
*/

var MooSlider = new Class({
    Implements: [Options, Events],
    options: {
        duration: 300
    },

    initialize: function (container, options) {
        this.setOptions(options);
        this.container = document.id(container);
        this._right = this.container.innerWidth();
        this._left = 0 - this._right;
        this.createBox();
    },

    createBox: function () {
        this.uid = String.uniqueID();
        var elem;
        if (this.options.homeBox)
            elem = document.id(this.options.homeBox);
        else
            elem = this.container.getChildren()[0];
        if (!elem) {
            elem = new Element('div', {
                'id': 'home_' + this.uid
            }).inject(this.container);
        }

        this.pool = {};
        var url = location.href;
        if (url.match(/^https?:\/\//))
            url = '/' + url.split('/').slice(3).join('/');
        this.current = url;
        this.pool[url] = elem;
        elem.store('url', url);
    },

    _move: function (el, position, fn) {
        new Fx.Tween(el, {
            duration: this.options.duration,
            property: 'left',
            onComplete: fn
        }).start(el.getStyle('left').toInt(), position);
    },

    back: function (reload) {
        this.moveTo(this.last, reload);
        History.back.delay(100);
    },

    moveTo: function (url, reload) {
        var box = this.pool[url];
        if (box == null) {
            window.location.href = url;
            return false;
        }

        if (url == this.current)
            return false;

        var temp = this.pool[this.current];
        temp.set('class', 'slider-box-center').setStyle('left', 0);
        var left = box.getStyle('left').toInt();
        if (left > 0) {
            box.set('class', 'slider-box-right').setStyle('left', this._right);
            this._move(temp, this._left, function () {
                temp.set('class', 'slider-box-left');
            });

            this._move(box, 0, function () {
                box.set('class', 'slider-box-current');
            }.bind(this));
        } else {
            box.set('class', 'slider-box-left').setStyle('left', this._left);
            this._move(temp, this._right, function () {
                temp.set('class', 'slider-box-right');
            });

            this._move(box, 0, function () {
                box.set('class', 'slider-box-current');
            }.bind(this));
        }

        this.current = url;
        this.last = temp.retrieve('url');

        if (reload)
            box.fireEvent('reload');
    },

    move: function (options, reload) {
        if (History)
            History.push(options.url);

        if (this.pool[options.url]) {
            this.moveTo(options.url, reload);
            return this;
        }

        var temp = this.pool[this.current];
        var el = new Element('div', {
            'class': 'slider-box-right'
        }).inject(this.container);
        el.store('url', options.url);

        temp.set('class', 'slider-box-center').setStyle('left', 0);
        this._move(temp, this._left, function () {
            temp.set('class', 'slider-box-left');
        });

        this._move(el, 0, function () {
            el.set('class', 'slider-box-current');
        });

        var req = new Request.HTML(Object.merge(options, {
            update: el,
            onComplete: function () {
                Function.attempt(el.unloading);
            }
        }));
        req.send();
        el.addEvent('reload', function () {
            if (options.reload) {
                options.reload();
            } else {
                Function.attempt(el.loading);
                req.send();
            }
        });

        this.pool[options.url] = el;
        this.current = options.url;
        this.last = temp.retrieve('url');
    },

    destroy: function () {
        this.clearBox();
    }
});
