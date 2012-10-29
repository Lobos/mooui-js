/**
 * user: lobos841@gmail.com
 * date: 12-10-26 下午3:01
 * license: MIT-style
 */

(function () {
    window.MooTabs = new Class({
        Implements: [Options, Events],

        options: {
            activeClass: 'active',
            slideClass: '',
            lazyLoad: true,
            ajax: 'ajax'
        },

        initialize: function (tabs, slides, options) {
            this.setOptions(options);
            tabs = this.tabs = $$(tabs);
            slides = $$(slides).hide();
            this.items = {};
            if (this.options.container)
                this.container = document.id(this.options.container);

            tabs.each(function (tab, i) {
                this.addTab(tab, slides[i]);
            }.bind(this));
        },

        addTab: function (tab, slide) {
            var ac = this.options.activeClass,
                self = this,
                id = String.uniqueID();
            tab.addEvent('click', function () {
                self.clear();
                this.addClass(ac);
                if (!self.items[id].slide)
                    self.items[id].slide = self.getSlide(tab.get(self.options.ajax));
                self.items[id].slide.show();
            });

            if (slide) this.lastSlide = slide;
            if (!this.options.lazyLoad && !slide)
                slide = this.getSlide(tab.get(this.options.ajax));

            this.items[id] = {
                tab: tab,
                slide: slide
            };

            if (tab.hasClass(ac)) tab.fireEvent('click');
            return this;
        },

        getSlide: function (url) {
            var slide = new Element('div', {'class': this.options.slideClass});

            if (url) {
                new Request.HTML({
                    url: url,
                    update: slide
                }).get();
            }

            if (this.lastSlide)
                slide.inject(this.lastSlide, 'after');
            else if (this.container)
                slide.inject(this.container);
            else
                slide.inject(this.tabs.getLast().getParent(), 'after');

            this.lastSlide = slide;
            return slide;
        },

        clear: function () {
            var ac = this.options.activeClass;
            Object.each(this.items, function (item) {
                item.tab.removeClass(ac);
                if (item.slide) item.slide.hide();
            });
            return this;
        }
    });
})();