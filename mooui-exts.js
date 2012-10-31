/**
 * User: lobos841@gmail.com
 * Date: 11-4-1
 * license: MIT License
 */

(function () {

    Element.implement({
        innerHeight: function () {
            return this.getStyle('height').toInt() + (this.getStyle('padding-top').toInt() || 0) + (this.getStyle('padding-bottom').toInt() || 0);
        },
        innerWidth: function () {
            return this.getStyle('width').toInt() + (this.getStyle('padding-left').toInt() || 0) + (this.getStyle('padding-right').toInt() || 0);
        },

        outerHeight: function (margin) {
            return (!margin) ? this.innerHeight() + (this.getStyle('border-top-width').toInt() || 0) + (this.getStyle('border-bottom-width').toInt() || 0) :
			this.outerHeight() + (this.getStyle('margin-top').toInt() || 0) + (this.getStyle('margin-bottom').toInt() || 0)
        },
        outerWidth: function (margin) {
            return (!margin) ? this.innerWidth() + (this.getStyle('border-left-width').toInt() || 0) + (this.getStyle('border-right-width').toInt() || 0) :
			this.outerWidth() + (this.getStyle('margin-left').toInt() || 0) + (this.getStyle('margin-right').toInt() || 0);
        },

        loading: function () {
            this.mask({ 'class': 'mask-loading' });
            return this;
        },

        unloading: function () {
            this.unmask();
            return this;
        },

        isHidden: function(){
            var w = this.offsetWidth, h = this.offsetHeight,
                force = (this.tagName.toLowerCase() === 'tr');
            return (w===0 && h===0 && !force) ? true : ((w!==0 && h!==0 && !force) ? false : this.getStyle('display') === 'none') || (this.get('opacity') == 0);
        },

        isVisible: function(){
            return !this.isHidden();
        }
    });

    String.implement({
        format: function () {
            var args = arguments;
            return this.replace(/\{(\d+)\}/g,
            function (m, i) {
                return args[i];
            });
        },
        length_cn: function () {
            var cArr = this.match(/[^\x00-\xff]/ig);
            return this.length + (cArr == null ? 0 : cArr.length);
        }
    });

    var ZINDEX = 1000;
    Object.extend('topZIndex', function () {
        return ZINDEX++;
    });
    Element.implement('topZIndex', function () {
        return this.setStyle('z-index', Object.topZIndex());
    });

    Number.implement({
        format: function(kSep, floatsep, decimals, fill) {
            decimals = decimals == undefined ? 2 : decimals;
            floatsep = floatsep == undefined ? '.' : floatsep;
            kSep = kSep == undefined ? ' ' : undefined;
            fill = fill == undefined ? '' : fill;
            var parts = this.round(decimals).toString().split('.'),
                    integer = parts[0];
            while (integer != (integer = integer.replace(/([0-9])(...($|[^0-9]))/, '$1' + kSep + '$2')));
            if (decimals === 0) return integer;
            var dec = parts[1] ? parts[1].substr(0, decimals) : '';
            if(fill) while(dec.length < decimals) dec += '0';
            return integer + (dec ? floatsep + dec : '')
        },

        toFileSize: function(units) {
            if(this == 0) return 0;
            var s = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'],
                    e = Math.floor(Math.log(this) / Math.log(1024));
            return (this / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + (units && units[e] ? units[e] : s[e]);
        }
    });

})();
