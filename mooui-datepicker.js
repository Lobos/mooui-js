/**
 * user: lobos841@gmail.com
 * date: 12-11-28 上午9:36
 * license: MIT-style
 */

(function () {

if (!this.MooUI) this.MooUI = {};

Locale.define('zh-CHS', 'MooUI_DatePicker', {
    year: '{0}年',
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    weeks: ['日', '一', '二', '三', '四', '五', '六']
});

var _gl = function (key) {
    return Locale.get('MooUI_DatePicker.' + key);
};

MooUI.DatePicker = new Class({
    Implements: [Options, Events],

    options: {
        destroyOnClose: true,
        css: {
            picker:             'date-picker',
            header:             'date-header',
            nextMonth:          'icon-metro-right icon-large right',
            previousMonth:      'icon-metro-left icon-large',
            active:             'active'
        }
    },

    initialize: function (el, options) {
        if (typeOf(el) == 'object') {
            options = el;
            el = null;
        }
        this.setOptions(options);
        this.css = this.options.css;
        this.create();

        this.currentDay = new Date();
    },

    create: function () {
        this.canvas = document.id(this.options.container) || document.body;
        var picker = this.picker = new Element('div', {
            'class': this.css.picker
        }).inject(this.canvas);

        // create header ====================================
        var header = new Element('div', {
            'class': this.css.header
        }).inject(picker);

        var _changeMonth = function (m) {
            var date = new Date(this.yearHandle.retrieve('year'), this.monthHandle.retrieve('month') + m, 1);
            this.draw(date.getFullYear(), date.getMonth());
        }.bind(this);

        new Element('i', {
            'class': this.css.previousMonth,
            events: {
                click: function () {
                    _changeMonth(-1);
                }
            }
        }).inject(header);

        new Element('i', {
            'class': this.css.nextMonth,
            events: {
                click: function () {
                    _changeMonth(1);
                }
            }
        }).inject(header);

        this.yearHandle = new Element('a', {
            href: 'javascript:;'
        }).inject(header);

        this.monthHandle = new Element('a', {
            href: 'javascript:;'
        }).inject(header);


        this.calendar = new Element('div').inject(picker);
    },

    bind: function (input) {
        input = document.id(input);
        var self = this;
        input.addEvent('click', function () {
            self.show(this.get('value'));
        });
    },

    draw: function (year, month) {
        var start = new Date(year, month, 1),
            index = 1 - start.getDay(),
            max = new Date(year, month + 1, 0).getDate(),
            lastDays = new Date(year, month, 0).getDate(),
            currentDay = null;

        if (year == this.currentDay.getFullYear() && month == this.currentDay.getMonth())
            currentDay = this.currentDay.getDate();

        this.yearHandle.set('html', _gl('year').format(year)).store('year', year);
        this.monthHandle.set('html', _gl('months')[month]).store('month', month);

        var table = new Element('table');
        //create weeks ======================================
        var weeks = new Element('tr');
        (7).times(function (i) {
            new Element('td', {
                html: _gl('weeks')[i]
            }).inject(weeks);
        });
        new Element('thead').grab(weeks).inject(table);

        //create days =======================================
        var tbody = new Element('tbody').inject(table);
        while (index <= max) {
            var tr = new Element('tr').inject(tbody);
            (7).times(function () {
                if (index > 0 && index <= max) {
                    var td = new Element('td').inject(tr);
                    new Element('a', {
                        href: 'javascript:;',
                        'class': index == currentDay ? this.css.active : '',
                        html: index
                    }).inject(td);
                } else {
                    new Element('td', {
                        html: index > 0 ? index - max : lastDays + index
                    }).inject(tr);
                }
                index++;
            }.bind(this));
        }

        this.calendar.empty().grab(table);
        table.fade('hide').fade('in');

        return this;
    },

    show: function (date) {
        date = date ? new Date.parse(date) : new Date();
        var year = date.getFullYear(),
            month = date.getMonth();

        this.currentDay = date;
        this.draw(year, month);
    },

    close: function () {

    },

    destroy: function () {

    }
});

})();