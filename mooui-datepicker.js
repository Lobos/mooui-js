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
        bind: null,
        format: '%Y-%m-%d', //mootools Date format
        css: {
            picker:             'date-picker',
            header:             'date-header',
            nextMonth:          'icon-metro-right icon-large right',
            previousMonth:      'icon-metro-left icon-large',
            active:             'active',
            yearSelect:         'year-select unstyled',
            monthSelect:        'month-select unstyled'
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
        if (this.options.bind) this.bind(this.options.bind);
    },

    create: function () {
        this.canvas = document.id(this.options.canvas) || document.body;
        var picker = this.picker = new Element('div', {
            'class': this.css.picker
        }).inject(this.canvas);

        // create header ====================================
        var header = new Element('div', {
            'class': this.css.header
        }).inject(picker);

        var _changeMonth = function (m) {
            var date = new Date(this.yearHandle.retrieve('year'), this.monthHandle.retrieve('month') + m, 1);
            this.drawDay(date.getMonth(), date.getFullYear());
        }.bind(this);

        new Element('i', {
            'class': this.css.previousMonth,
            events: {
                click: function () {
                    switch (this.stage) {
                        case 'year':
                            var y = this.yearHandle.retrieve('year') - 25;
                            this.drawYear(y);
                            break;
                        default:
                            _changeMonth(-1);
                            break;
                    }
                }.bind(this)
            }
        }).inject(header);

        new Element('i', {
            'class': this.css.nextMonth,
            events: {
                click: function () {
                    switch (this.stage) {
                        case 'year':
                            var y = this.yearHandle.retrieve('year') + 25;
                            this.drawYear(y);
                            break;
                        default:
                            _changeMonth(1);
                            break;
                    }
                }.bind(this)
            }
        }).inject(header);

        this.yearHandle = new Element('a', {
            href: 'javascript:;',
            events: {
                click: function () {
                    this.drawYear();
                }.bind(this)
            }
        }).inject(header);

        this.monthHandle = new Element('a', {
            href: 'javascript:;',
            events: {
                click: this.drawMonth.bind(this)
            }
        }).inject(header);

        //create calendar
        this.calendar = new Element('div').inject(picker);
    },

    bind: function (inputs) {
        var self = this;
        $$(inputs).addEvent('click', function () {
            self.bindInput = this;
            self.open.delay(5, self, [this.get('value')]);
        });
        return this;
    },

    drawYear: function (year) {
        var ul = new Element('ul', {
            'class': this.css.yearSelect
        });

        if (year)
            this.yearHandle.set('html', _gl('year').format(year)).store('year', year);
        else
            year = this.yearHandle.retrieve('year');

        year = year - 12 < 0 ? 0 : year - 12;
        (25).times(function (i) {
            var y = year + i;
            new Element('li', {
                html: y,
                events: {
                    click: function () {
                        this.yearHandle.set('html', _gl('year').format(y)).store('year', y);
                        this.drawMonth();
                    }.bind(this)
                }
            }).inject(ul);
        }.bind(this));

        this.calendar.empty().grab(ul);
        this.stage = 'year';

        if (this.showAbove) this.position();
        return this;
    },

    drawMonth: function () {
        var ul = new Element('ul', {
            'class': this.css.monthSelect
        });
        (12).times(function (i) {
            var m = _gl('months')[i];
            new Element('li', {
                html: m,
                events: {
                    click: function () {
                        this.monthHandle.set('html', m).store('month', i);
                        this.drawDay(i);
                    }.bind(this)
                }
            }).inject(ul);
        }.bind(this));
        this.calendar.empty().grab(ul);
        this.stage = 'month';

        if (this.showAbove) this.position();
        return this;
    },

    drawDay: function (month, year) {
        if (month == undefined) month = this.monthHandle.retrieve('month');
        year = year || this.yearHandle.retrieve('year');
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
                    var day = index;
                    new Element('a', {
                        href: 'javascript:;',
                        'class': day == currentDay ? this.css.active : '',
                        html: day,
                        events: {
                            click: function () {
                                this.selectDay(day);
                            }.bind(this)
                        }
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
        this.stage = 'day';

        if (this.showAbove) this.position();
        return this;
    },

    selectDay: function (day) {
        var date = new Date(this.yearHandle.retrieve('year'), this.monthHandle.retrieve('month'), day);
        this.bindInput.set('value', date.format(this.options.format));
        this.close();
    },

    open: function (date) {
        this.picker.show();

        date = date ? new Date.parse(date) : new Date();
        var year = date.getFullYear(),
            month = date.getMonth();

        this.currentDay = date;
        this.drawDay(month, year);
        this.checkAbove().position();
        this.isOpen = true;

        var _close = function (event) {
            if (this.picker.contains(event.target)) return;
            this.close();
            document.removeEvent('click', _close);
        }.bind(this);

        document.addEvent.delay(10, document, ['click', _close]);
    },

    checkAbove: function () {
        var pos = this.bindInput.getPosition(this.canvas),
            bws = this.canvas == document.body ? { x:0, y:0 } : this.canvas.getScroll(),
            top = pos.y + this.bindInput.outerHeight() - bws.y + 3,
            h = this.picker.outerHeight();
        h = h > 300 ? h : 300;
        this.showAbove = top + h > this.canvas.getSize().y + this.canvas.getScroll().y;
        return this;
    },

    position: function () {
        var pos = this.bindInput.getPosition(this.canvas),
            bws = this.canvas == document.body ? { x:0, y:0 } : this.canvas.getScroll(),
            left = pos.x + bws.x,
            top = pos.y + this.bindInput.outerHeight() - bws.y + 3;

        if (this.showAbove)
            top = pos.y - this.picker.outerHeight() + bws.y - 3;

        this.picker.setStyles({
            'left': left,
            'top': top,
            'z-index': Object.topZIndex()
        });

    },

    close: function () {
        this.isOpen = false;
        this.picker.hide();
    },

    destroy: function () {
        this.picker.destroy();
    }
});

})();