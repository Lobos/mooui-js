/**
 * User: lobos841@gmail.com
 * Date: 2012-2-29
 */

(function () {
    /* ============= locale ======================*/
    Locale.define('zh-CHS', 'Pager', {
        count: '共: {total} 条&nbsp; 当前: {start} - {max}'
    });

    if (!this.MooUI) this.MooUI = {};
    MooUI.Pagination = new Class({
        Implements: [Options, Events],
        options: {
            size: 10,
            index: 1,
            total: 0,
            capacity: 10,
            showCount: false
        },
        initialize: function (container, options) {
            this.setOptions(options);
            this.container = document.id(container);
        },
        change: function (options) {
            if (typeOf(options) == 'number')
                options = { index: options };
            this.setOptions(options);
            this.draw(this.options.index);
        },
        pageChange: function (index) {
            this.fireEvent('pageChange', index);
        },
        draw: function (index) {
            index = index || this.options.index;
            var half = Math.ceil(this.options.capacity / 2);
            index = index < half ? half : index;
            var min = index - half;
            min = min < 1 ? 1 : min;
            var max = min + this.options.capacity - 1;
            var maxPages = Math.ceil(this.options.total / this.options.size);
            if (max >= maxPages) {
                max = maxPages;
                if (maxPages > this.options.capacity)
                    min = maxPages - this.options.capacity;
            }
            this.container.empty();
            var self = this;

            var ul = new Element('ul').inject(this.container);


            if (index > 1) {
                this.createItem('&laquo;', function () {
                    self.pageChange(self.options.index - 1);
                }).inject(ul);
            }
            if (min > 1) {
                this.createItem(1, function () {
                    self.pageChange(1);
                }).inject(ul);
            }
            for (var i = min; i <= max; i++) {
                this.createItem(i, function () {
                    self.pageChange(this);
                }.bind(i), i == this.options.index).inject(ul);
            }
            if (max < maxPages) {
                this.createItem(maxPages, function () {
                    self.pageChange(maxPages);
                }).inject(ul);
            }
            if (index < max) {
                this.createItem('&raquo;', function () {
                    self.pageChange(self.options.index + 1);
                }).inject(ul);
            }


            if (this.options.showCount) {
                var maxCount = index * this.options.size;
                maxCount = maxCount > this.options.total ? this.options.total : maxCount;
                var startCount = ((index - 1) * this.options.size + 1);
                var account = Locale.get('Pager.count').substitute({
                    total: this.options.total,
                    start: startCount,
                    max: maxCount
                });
                new Element('span', {
                    'class': 'page-count',
                    'html': account
                }).inject(this.container);
            }
        },
        createItem: function (html, fn, current) {
            var li = new Element('li').grab(
                new Element('a', {
                    'html': html,
                    'href': 'javascript:;'
                })
            );
            if (current)
                li.addClass('disabled');
            else if (fn)
                li.addEvent('click', fn);

            return li;
        }
    });
})();
