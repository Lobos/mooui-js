/**
 * user: lobos841@gmail.com
 * date: 12-10-24 上午9:51
 * license: MIT-style
 */

(function () {
    window.MooDropdown = new Class({
        Implements: [Options],

        options: {},

        initialize: function (el, options) {
            this.setOptions(options);
            this.handle = document.id(el);
            this.dropbox = this.handle.getElement('.dropdown-menu') || this.handle.getNext('.dropdown-menu');
            this.isOpen = false;

            this.handle.addEvent('click', this.open.bind(this));
        },

        open: function () {
            if (this.isOpen) return;

            this.handle.addClass('open');
            this.dropbox.show();
            this.isOpen = true;

            var self = this;
            var _close = function () {
                self.close();
                document.body.removeEvent('click', _close);
            };

            //这里需要delay一下，否则document.body.click会立刻执行。
            document.id(document.body).addEvent.delay(50, document.body, ['click', _close]);
        },

        close: function () {
            this.handle.removeClass('open');
            this.dropbox.hide();
            this.isOpen = false;
        }
    });

    Element.implement({
        dropdown: function(options){
            return this.store('dropdown', new MooDropdown(this, options));
        }
    });
})();
