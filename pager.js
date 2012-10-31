/**
 * User: lobos841@gmail.com
 * Date: 2012-2-29
 */

(function () {
    /* ============= locale ======================*/
    Locale.define('zh-CHS', 'Pager', {
        account: '共: {total} 条&nbsp; 当前: {start} - {max}'
    });

    window.Pager = new Class({
        Implements: [Options, Events],
        options: {
            size: 10,
            index: 1,
            total: 0,
            step: 5,
            showAccount: false
        },
        initialize: function (box, options) {
            this.setOptions(options);
            this.box = document.id(box);
        },
        change: function (options) {
            this.setOptions(options);
            this.draw();
        },
        pageChange: function (index) {
            this.fireEvent('pageChange', index);
        },
        draw: function () {
            var min = this.options.index - this.options.step;
            min = min < 1 ? 1 : min;
            var max = this.options.index + this.options.step;
            var maxPages = Math.ceil(this.options.total / this.options.size);
            max = max > maxPages ? maxPages : max;
            this.box.empty();
            var self = this;

            var ul = new Element('ul', {
                'class': 'pager'
            }).inject(this.box);

            if (min > 1) {
                this.createItem('&laquo;...', function () {
                    self.pageChange(1);
                }).inject(ul);
            }
            for (var i = min; i <= max; i++) {
                this.createItem(i, function () {
                    self.pageChange(this);
                }.bind(i), i == this.options.index).inject(ul);
            }
            if (max < maxPages) {
                this.createItem('...&raquo;', function () {
                    self.pageChange(maxPages);
                }).inject(ul);
            }

            if (this.options.showAccount) {
                var maxCount = this.options.index * this.options.size;
                maxCount = maxCount > this.options.total ? this.options.total : maxCount;
                var startCount = ((this.options.index - 1) * this.options.size + 1);
                var account = Locale.get('Pager.account').substitute({
                    total: this.options.total,
                    start: startCount,
                    max: maxCount
                });
                new Element('span', {
                    'class': 'page-account',
                    'html': account
                }).inject(this.box);
            }
        },
        createItem: function (html, fn, current) {
            var li = new Element('li');
            var lnk = new Element('a', {
                'html': html,
                'events': { 'click': fn }
            }).inject(li);
            if (current) {
                lnk.removeEvent('click').addClass('current');
            }

            return li;
        }
    });
})();
