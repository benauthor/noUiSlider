/* noUiSlider 3.2.1.hacked-upon-by-usn */

/* 06-27-2013: noUiSlider was added by Dominique Moreno-Baltierra.
 *
 * We have hacked upon it pretty mercilessly.
 * */
(function ($) {

	$.fn.noUiSlider = function (options, flag) {

		// test for mouse, pointer or touch
		var EVENT = window.navigator.msPointerEnabled ? 2 : 'ontouchend' in document ? 3 : 1;
		if (window.debug && console) {
			console.log(EVENT);
		}

		// shorthand for test=function, calling
		function call(f, scope, args) {
			if (typeof f === "function") {
				f.call(scope, args);
			}
		}

		// function wrapper for calculating to and from range values
		var percentage = {
			to : function (range, value) {
				value = range[0] < 0 ? value + Math.abs(range[0]) : value - range[0];
				return (value * 100) / this._length(range);
			},
			from : function (range, value) {
				return (value * 100) / this._length(range);
			},
			is : function (range, value) {
				return ((value * this._length(range)) / 100) + range[0];
			},
			_length : function (range) {
				return (range[0] > range[1] ? range[0] - range[1] : range[1] - range[0]);
			}
		};

        function bigPrettyNumber(n) {
            // Number as a string, with commas. 1000 => 1,000
            var parts=n.toString().split(".");
            return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
        }

        function andUnderOver(range, value, pretty) {
            // format a number for display with an 'and under' less-than sign
            // or an 'and over' plus sign.
            var formatted = pretty ? bigPrettyNumber(value) : value;
            if (value == range[0]) {
                return '<' + formatted;
            } else if (value == range[range.length - 1]) {
                return formatted + '+';
            } else {
                return formatted;
            }
        }

		// bounce handles of eachother, the edges of the slider
		function correct(proposal, slider, handle) {

			var
			setup = slider.data('setup'),
			handles = setup.handles,
			settings = setup.settings,
			pos = setup.pos;

			proposal = proposal < 0 ? 0 : proposal > 100 ? 100 : proposal;

			if (settings.handles == 2) {
				if (handle.is(':first-child')) {
					var other = parseFloat(handles[1][0].style[pos]) - settings.margin;
					proposal = proposal > other ? other : proposal;
				} else {
					var other = parseFloat(handles[0][0].style[pos]) + settings.margin;
					proposal = proposal < other ? other : proposal;
				}
			}

			if (settings.step) {
				var per = percentage.from(settings.range, settings.step);
				proposal = Math.round(proposal / per) * per;
			}

			return proposal;

		}

		// get standarised clientX and clientY
		function client(f) {
			try {
				return [(f.clientX || f.originalEvent.clientX || f.originalEvent.touches[0].clientX), (f.clientY || f.originalEvent.clientY || f.originalEvent.touches[0].clientY)];
			} catch (e) {
				return ['x', 'y'];
			}
		}

		// get native inline style value in %
		function place(handle, pos) {
			return parseFloat(handle[0].style[pos]);
		}

        // simplified defaults
		var defaults = {
			handles : 2,
			serialization : {
				to : ['', ''],
				resolution : 0.01,
			},
            measureLines: true,
            displayHold: 1500
		};

		// contains all methods
		methods = {
			create : function () {

				return this.each(function () {

					function setHandle(handle, to, slider) {
					// set handle to position
						handle.css(pos, to + '%').data('input').val(percentage.is(settings.range, to).toFixed(res));
					}

					var
					settings = $.extend(defaults, options),
					// handles
					handlehtml = '<a><div class="t t-centered t-strong handle"></div></a>',
					// save this to variable, // allows identification
					slider = $(this).data('_isnS_', true),
					// array of handles
					handles = [],
					// the way the handles are positioned for this slider, top/left
					pos,
					// for quick orientation testing and array matching
					orientation,
					// append classes
					classes = "",
					// tests numerical
					num = function (e) {
						return !isNaN(parseFloat(e)) && isFinite(e);
					},
					// counts decimals in serialization, sets default
					split = (settings.serialization.resolution = settings.serialization.resolution || 0.01).toString().split('.'),
					res = split[0] == 1 ? 0 : split[1].length;

                    this.settings = settings;
                    this.handles = handles;
                    this.slider = slider;
                    this.pos = pos;
                    this.orientation = orientation;
                    this.classes = classes;


                    // evan's new public methods
                    this.allValues = function () {
                        var values = [];
                        $.each(this.handles, function (i, handle) {
                            values.push(handle.data().input.val());
                        });
                        return values;
                    };
                    this.allPositions = function () {
                        var that = this,
                            values = [],
                            width = Math.abs(that.settings.range[1] - that.settings.range[0]),
                            offset = that.settings.range[0] * 100 / width;

                        $.each(that.allValues(), function (i, v) {
                                values.push((v * 100 / width) - offset);
                        });
                        return values;
                    };
                    this.updatePositions = function () {
                        var that = this,
                            positions = this.allPositions();
                        $.each(that.handles, function (i, handle) {
                            handle.css('left', positions[i] + '%');
                        });
                    };
                    this.max = function () {
                        var that = this;
                        that.handles[0].data().input.val(that.settings.range[0]);
                        that.handles[1].data().input.val(that.settings.range[1]);
                        that.updatePositions();
                    };

					settings.start = num(settings.start) ? [settings.start, 0] : settings.start;

					// logs bad input values, if possible
					$.each(settings, function (a, b) {

						if (num(b)) {
							settings[a] = parseFloat(b);
						} else if (typeof b == "object" && num(b[0])) {
							b[0] = parseFloat(b[0]);
							if (num(b[1])) {
								b[1] = parseFloat(b[1]);
							}
						}

						var e = false;
						b = typeof b == "undefined" ? "x" : b;

						switch (a) {
						case 'range':
						case 'start':
							e = b.length != 2 || !num(b[0]) || !num(b[1]);
							break;
						case 'handles':
							e = (b < 1 || b > 2 || !num(b));
							break;
						case 'connect':
							e = b != "lower" && b != "upper" && typeof b != "boolean";
							break;
						case 'orientation':
							e = (b != "vertical" && b != "horizontal");
							break;
						case 'margin':
						case 'step':
							e = typeof b != "undefined" && !num(b);
							break;
						case 'serialization':
							e = typeof b != "object" || !num(b.resolution) || (typeof b.to == 'object' && b.to.length < settings.handles);
							break;
						case 'slide':
							e = typeof b != "function";
							break;
						}

						if (e && console) {
							console.error('Bad input for ' + a + ' on slider:', slider);
						}

					});

					settings.margin = settings.margin ? percentage.from(settings.range, settings.margin) : 0;

					// tests serialization to be strings or jQuery objects
					if (settings.serialization.to instanceof jQuery || typeof settings.serialization.to == 'string' || settings.serialization.to === false) {
						settings.serialization.to = [settings.serialization.to];
					}

					if (settings.orientation == "vertical") {
						classes += "vertical";
						pos = 'top';
						orientation = 1;
					} else {
						classes += "horizontal";
						pos = 'left';
						orientation = 0;
					}

					classes += settings.connect ? settings.connect == "lower" ? " connect lower" : " connect" : "";

					slider.addClass(classes);

					for (var i = 0; i < settings.handles; i = i + 1) {
						handles[i] = slider.append(handlehtml).children(':last');
                        if (settings.underOver) {
                            handles[i].find('.handle').text(andUnderOver(settings.range, settings.start[i], settings.prettyNumber));
                        } else {
                            var handleText = settings.prettyNumber ? bigPrettyNumber(settings.start[i]) : settings.start[i];
                            handles[i].find('.handle').text(handleText);
                        }
						var setTo = percentage.to(settings.range, settings.start[i]);
						handles[i].css(pos, setTo + '%');
						if (setTo == 100 && handles[i].is(':first-child')) {
							handles[i].css('z-index', 2);
						}

						var bind = '.noUiSlider',
						onEvent = (EVENT === 1 ? 'mousedown' : EVENT === 2 ? 'MSPointerDown' : 'touchstart') + bind + 'X',
						moveEvent = (EVENT === 1 ? 'mousemove' : EVENT === 2 ? 'MSPointerMove' : 'touchmove') + bind,
						offEvent = (EVENT === 1 ? 'mouseup' : EVENT === 2 ? 'MSPointerUp' : 'touchend') + bind;

						handles[i].find('div').on(onEvent, function (e) {

							$('body').bind('selectstart' + bind, function () {
								return false;
							});

							if (!slider.hasClass('disabled')) {

								$('body').addClass('TOUCH');

								var handle = $(this).addClass('active').parent(),
								unbind = handle.add($(document)).add('body'),
								originalPosition = parseFloat(handle[0].style[pos]),
								originalClick = client(e),
								previousClick = originalClick,
								previousProposal = false;

								$(document).on(moveEvent, function (f) {

									f.preventDefault();

									var currentClick = client(f);

									if (currentClick[0] == "x") {
										return;
									}

									currentClick[0] -= originalClick[0];
									currentClick[1] -= originalClick[1];

									var movement = [
										previousClick[0] != currentClick[0], previousClick[1] != currentClick[1]
									],
									proposal = originalPosition + ((currentClick[orientation] * 100) / (orientation ? slider.height() : slider.width()));
									proposal = correct(proposal, slider, handle);

									if (movement[orientation] && proposal != previousProposal) {
										handle.css(pos, proposal + '%').data('input').val(percentage.is(settings.range, proposal).toFixed(res));
										call(settings.slide, slider.data('_n', true), settings);
										previousProposal = proposal;
										/* handle.css('z-index', handles.length == 2 && proposal == 100 && handle.is(':first-child') ? 2 : 1); */
									}

									previousClick = currentClick;

								}).on(offEvent, function () {

									unbind.off(bind);
									$('body').removeClass('TOUCH');
									if (slider.find('.active').end().data('_n')) {
										slider.data('_n', false).change();
									}
                                    setTimeout(function () {
                                        slider.find('.active').removeClass('active');
                                    }, settings.displayHold);

								});

							}
						}).on('click', function (e) {
							e.stopPropagation();
						});

					}

					if (EVENT == 1) {
						slider.on('click', function (f) {
							if (!slider.hasClass('disabled')) {
								var currentClick = client(f),
								proposal = ((currentClick[orientation] - slider.offset()[pos]) * 100) / (orientation ? slider.height() : slider.width()),
								handle = handles.length > 1 ? (currentClick[orientation] < (handles[0].offset()[pos] + handles[1].offset()[pos]) / 2 ? handles[0] : handles[1]) : handles[0];
								setHandle(handle, correct(proposal, slider, handle), slider);
                                $(handle).find('.handle').addClass('active');
								call(settings.slide, slider);
								slider.change();
                                setTimeout(function () {
                                    $(handle).find('.handle').removeClass('active');
                                }, settings.displayHold);
							}
						});
					}

					for (var i = 0; i < handles.length; i++) {
						var val = percentage.is(settings.range, place(handles[i], pos)).toFixed(res);
						if (typeof settings.serialization.to[i] == 'string') {
							handles[i].data('input',
								slider.append('<input type="hidden" name="' + settings.serialization.to[i] + '">').find('input:last')
								.val(val)
								.change(function (a) {
									a.stopPropagation();
								}));
						} else if (settings.serialization.to[i] == false) {
							handles[i].data('input', {
								val : function (a) {
									if (typeof a != 'undefined') {
										this.handle.data('noUiVal', a);
									} else {
										return this.handle.data('noUiVal');
									}
								},
								handle : handles[i]
							});
					    } else {
							handles[i].data('input', settings.serialization.to[i].data('handleNR', i).val(val).change(function () {
									var arr = [null, null];
									arr[$(this).data('handleNR')] = $(this).val();
									slider.val(arr);
								}));
						}
					}

					$(this).data('setup', {
						settings : settings,
						handles : handles,
						pos : pos,
						res : res
					});

				});
			},
			val : function () {

				if (typeof arguments[0] !== 'undefined') {

					var val = typeof arguments[0] == 'number' ? [arguments[0]] : arguments[0];

					return this.each(function () {

						var setup = $(this).data('setup');

						for (var i = 0; i < setup.handles.length; i++) {
							if (val[i] != null) {
								var proposal = correct(percentage.to(setup.settings.range, val[i]), $(this), setup.handles[i]);
								setup.handles[i].css(setup.pos, proposal + '%').data('input').val(percentage.is(setup.settings.range, proposal).toFixed(setup.res));
							}
						}
					});

				} else {

					var handles = $(this).data('setup').handles,
					re = [];
					for (var i = 0; i < handles.length; i++) {
						re.push(parseFloat(handles[i].data('input').val()));
					}
					return re.length == 1 ? re[0] : re;

				}
			},
			disabled : function () {
				return flag ? $(this).addClass('disabled') : $(this).removeClass('disabled');
			}
		}

		// remap the native/current val function to noUiSlider
		var $_val = jQuery.fn.val;

		jQuery.fn.val = function () {
			return this.data('_isnS_') ? methods.val.apply(this, arguments) : $_val.apply(this, arguments);
		}

		return options == "disabled" ? methods.disabled.apply(this) : methods.create.apply(this);

	}

})(jQuery);
