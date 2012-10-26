/**
 * user: lobos841@gmail.com
 * date: 12-10-26 下午3:01
 * license: MIT-style
 */

(function () {
    window.MooTabs = new Class({
        Implements: [Options, Events],

        options: {
            activeClass: 'active'
        },

        initialize: function (tabs, slides, options) {
            this.setOptions(options);
            tabs = this.tabs = $$(tabs);
            slides = this.slides = $$(slides).hide();
            options = this.options;

            this.tabs.each(function (tab, i) {
                tab.addEvent('click', function () {
                    tabs.removeClass(options.activeClass);
                    this.addClass(options.activeClass);

                    slides.hide();
                    if (slides[i])
                        slides[i].show();
                });

                if (tab.hasClass(options.activeClass) && slides[i])
                    slides[i].show();
            });
        }
    });
})();