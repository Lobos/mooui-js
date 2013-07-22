/**
 * User: Lobos841@gmail.com
 * Date: 2012-2-22
 * mootools.more 里面的Form验证太繁琐，根据以前写的formcheck简化了一些，验证格式为Json
 * validate="{required:true, type:'type', maxLen:100, ...}"
 */

(function () {
    if (!this.MooUI) this.MooUI = {};

    /* ============= locale ======================*/
    Locale.define('zh-CHS', 'MooUIValidator', {
        required: '{0}不能为空',
        alpha: '{0}只允许字母',
        alphanum: '{0}只允许字母、数字和下划线',
        password: '{0}只允许英文字母、符号或数字',
        digit: '{0}必须为整数',
        number: '{0}必须为数字',
        email: '{0}格式不正确',
        phone: '{0}格式不正确',
        date: '{0}格式不正确',
        url: '{0}格式不正确',
        maxlen: '不能超过{0}个字符',
        minlen: '不能少于{0}个字符',
        tabmaxlen: '不能超过{0}个词组',
        tabminlen: '不能少于{0}个词组',
        equal: '必须和{0}相同',
        ext: '必须为“{0}”格式的文件',
        ajax: '不正确'
    });

    MooUI.Validator = new Class({
        Implements: [Options, Events],

        regexp: {
            alpha: /^[a-z ._-]+$/i,
            alphanum: /^[a-z0-9_]+$/i,
            password: /^[\x00-\xff]+$/,
            date: /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/,
            digit: /^[-+]?[0-9]+$/,
            number: /^[-+]?\d*\.?\d+$/,
            email: /^[a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,
            tel: /^[\d\s ().-]+$/,
            url: /^(http|https|ftp)\:\/\/[a-z0-9\-\.]+\.[a-z]{2,3}(:[a-z0-9]*)?\/?([a-z0-9\-\._\?\,\'\/\\\+&amp;%\$#\=~])*$/i
        },

        options: {
            evaluateOnChange: true,
            evaluateOnBlur: true,
            stopOnFailure: true
        },

        initialize: function (form, options) {
            this.setOptions(options);
            this.form = document.id(form) || document.body;

            this._bound = {
                blurOrChange: function(event, field){
                    this.validationMonitor(field);
                }.bind(this)
            };
            if (this.options.evaluateOnBlur)
                this.form.addEvent('blur:relay([validate])', this._bound.blurOrChange);

            if (this.options.evaluateOnChange)
                this.form.addEvent('change:relay([validate])', this._bound.blurOrChange);
        },

        addElement: function (el) {
            if (typeOf(el) == 'element')
                el = el.id;
            if (this.options.evaluateOnBlur)
                this.form.addEvent('blur:relay(#' + el + ')', this._bound.blurOrChange);
            if (this.options.evaluateOnChange)
                this.form.addEvent('change:relay(#' + el + ')', this._bound.blurOrChange);
            return this;
        },

        validate: function () {
            var success = true;
            this.form.getElements('[validate]').each(function (element) {
                if (this.options.stopOnFailure && !success)
                    return;

                try {
                    success = this.validateField(element) && success;
                } catch (e) {
                    success = false;
                    Function.attempt(function () {
                        console.log(e + element.get('validate'));
                    });
                }
            }.bind(this));
            return success;
        },

        validateField: function (element) {
            var _getMsg = MooUI.Validator.getMsg;
            var success = true,
                msg = '',
                txt = '',
                tag = element.get('tag');

            if (tag == 'input' || tag == 'textarea')
                txt = element.get('value').trim();
            else
                txt = element.get('text').trim();

            var valstr = element.get('validate');
            if (!/^{.*}$/.test(valstr))
                valstr = '{' + valstr + '}';
            var data = JSON.decode(valstr);

            //======================== required =======================
            if (data.required && txt.length == 0) {
                msg = _getMsg('required');
                success = false;
            }

            //======================== type ===========================
            var _type =  data.type || element.get('type');
            if (success && Object.keys(Object.clone(this.regexp)).contains(_type) && txt.length > 0 && !this.regexp[_type].test(txt)) {
                msg = _getMsg(_type);
                success = false;
            }

            //======================== ajax ===========================
            if (success && txt.length > 0 && data.ajax) {
                var json = this.checkAjax(txt, data.ajax.url, element.get('name'));
                if (json.status == 0) {
                    msg = json.msg || _getMsg(data.type);
                    success = false;
                }
            }

            //======================== max length =====================
            if (success && data.maxlen && txt.lengthCn() > data.maxlen) {
                msg = _getMsg('maxlen').format(data.maxlen);
                success = false
            }

            //======================= min length ======================
            if (success && data.minlen && txt.lengthCn() < data.minlen) {
                msg = _getMsg('minlen').format(data.minlen);
                success = false;
            }


            if (txt.length > 0) {
                //======================= tab min length ==================
                var _tablen = txt.split(data.separator || ' ').length;
                if (success && data.tabminlen && _tablen < data.tabminlen) {
                    msg = _getMsg('tabminlen').format(data.tabminlen);
                    success = false;
                }

                //======================= tab max length ==================
                if (success && data.tabmaxlen && _tablen > data.tabmaxlen) {
                    msg = _getMsg('tabmaxlen').format(data.tabmaxlen);
                    success = false;
                }
            }

            //====================== equal element ====================
            if (success && data.equal) {
                var rtxt = '';
                var rel = document.id(data.equal);
                if (rel.get('tag') == 'input' || rel.get('tag') == 'textarea')
                    rtxt = rel.get('value');
                else
                    rtxt = rel.get('html');

                if (txt != rtxt) {
                    msg = _getMsg('equal').format(data.title);
                    success = false;
                }
            }

            if (success && data.ext) {
                var ext = txt.substr(txt.lastIndexOf('.') + 1);
                var de = data.ext.split(',');
                if (!de.contains(ext)) {
                    msg = _getMsg('ext').format(data.ext);
                    success = false;
                }
            }

            if (success) {
                this.fireEvent('success', element);
            } else {
                msg = data.msg || msg.format(element.get('title') || '');
                this.fireEvent('failure', [element, msg]);
            }

            return success;
        },

        validationMonitor: function(){
            clearTimeout(this.timer);
            this.timer = this.validateField.delay(50, this, arguments);
        },

        checkAjax: function (txt, url, key) {
            var valid = false;
            var data = {};
            data[key] = txt;
            new Request.JSON({
                url: url,
                async: false,
                method: 'post',
                data: data,
                onSuccess: function (json) {
                    valid = json;
                }
            }).send();
            return valid;
        }
    });

    MooUI.Validator.getMsg = function (key) {
        return Locale.get('MooUIValidator.' + key)
    };

    MooUI.Validator.MessageBox = {
        show: function (content, pos) {
            if (!this.box) this.create();
            this.errorContent.set('html', content);
            this.box.setStyles({
                'visibility': 'visible',
                'z-index': Object.topZIndex(),
                'left': pos.x,
                'top': pos.y - this.box.outerHeight().toInt() - 7
            });

            //window.setTimeout(this.close.bind(this), 10000);
        },

        close: function () {
            if (this.box)
                this.box.setStyles({ 'visibility': 'hidden', 'left': -9999, 'top': -9999 });
        },

        destroy: function () {
            if (!this.box) return;
            this.box.destroy();
            delete this.box;
        },

        create: function () {
            var box = new Element('div', {
                'class': 'formcheck-box',
                'styles': {
                    'left': -9999,
                    'top': -9999,
                    'visibility': 'hidden',
                    'position': 'absolute'
                }
            }).inject(document.body);

            this.errorContent = new Element('div').injectInside(box);
            //if (this.options.showCloseTipsButton)
            new Element('a', {
                'class': 'close',
                'html': '&times;',
                'events': {
                    'click': function () { box.setStyles({ 'visibility': 'hidden', 'left': -9999, 'top': -9999 }); }
                }
            }).inject(box);

            this.box = box;
        }
    };

    MooUI.Validator.TypeDict = [
        { text: '不限', value: '' },
        { text: '字母', value: 'alpha' },
        { text: '非汉字', value: 'password' },
        { text: '整数', value: 'digit' },
        { text: '字母和数字', value: 'alphanum' },
        { text: '数字（小数）', value: 'number' },
        { text: '邮箱', value: 'email' },
        { text: '电话', value: 'phone' },
        { text: '网址', value: 'url' },
        { text: '日期', value: 'date' }
    ];
})();
