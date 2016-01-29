/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	(function ($, Bloodhound) {
	  if ($ === undefined) {
	    throw new Error('BioInput requires jQuery and it is currently undefined.');
	  }
	  if (Bloodhound === undefined) {
	    throw new Error('BioInput requires Bloodhound and it is currently undefined. ' + 'This is included with the latest version of typeahead.js');
	  }
	  /**
	   * Most options support both a string or number as well as a function as
	   * option value. This function makes sure that the option with the given
	   * key in the given options is wrapped in a function
	   */
	  function makeOptionItemFunction(options, key) {
	    if (typeof options[key] !== 'function') {
	      (function () {
	        var propertyName = options[key];
	        options[key] = function (item) {
	          return item[propertyName];
	        };
	      })();
	    }
	  }
	
	  function makeOptionFunction(options, key) {
	    if (typeof options[key] !== 'function') {
	      (function () {
	        var value = options[key];
	        options[key] = function () {
	          return value;
	        };
	      })();
	    }
	  }
	
	  /**
	   * Returns the position of the caret in the given input field
	   */
	  function getCaretPosition(oField) {
	    var iCaretPos = 0;
	    if (document.selection) {
	      oField.focus();
	      var oSel = document.selection.createRange();
	      oSel.moveStart('character', -oField.value.length);
	      iCaretPos = oSel.text.length;
	    } else if (oField.selectionStart || oField.selectionStart === '0') {
	      iCaretPos = oField.selectionStart;
	    }
	    return iCaretPos;
	  }
	
	  /**
	    * Returns boolean indicates whether user has pressed an expected key combination.
	    * @param object keyPressEvent: JavaScript event object, refer
	    *     http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	    * @param object lookupList: expected key combinations, as in:
	    *     [13, {which: 188, shiftKey: true}]
	    */
	  function keyCombinationInList(keyPressEvent, lookupList) {
	    var found = false;
	    $.each(lookupList, function (index, keyCombination) {
	      if (typeof keyCombination === 'number' && keyPressEvent.which === keyCombination) {
	        found = true;
	        return false;
	      }
	
	      if (keyPressEvent.which === keyCombination.which) {
	        var alt = !keyCombination.hasOwnProperty('altKey') || keyPressEvent.altKey === keyCombination.altKey;
	        var shift = !keyCombination.hasOwnProperty('shiftKey') || keyPressEvent.shiftKey === keyCombination.shiftKey;
	        var ctrl = !keyCombination.hasOwnProperty('ctrlKey') || keyPressEvent.ctrlKey === keyCombination.ctrlKey;
	        if (alt && shift && ctrl) {
	          found = true;
	          return false;
	        }
	      }
	    });
	
	    return found;
	  }
	
	  /**
	   * HtmlEncodes the given value
	   */
	  var htmlEncodeContainer = $('<div />');
	  function htmlEncode(value) {
	    return value ? htmlEncodeContainer.text(value).html() : '';
	  }
	
	  var defaultOptions = {
	    tagClass: function tagClass() {
	      return 'bioinput-label';
	    },
	    focusClass: 'focus',
	    itemValue: function itemValue(item) {
	      return item ? item.toString() : item;
	    },
	    itemText: function itemText(item) {
	      return this.itemValue(item);
	    },
	    itemTitle: function itemTitle() {
	      return null;
	    },
	    freeInput: true,
	    addOnBlur: true,
	    maxTags: undefined,
	    maxChars: undefined,
	    confirmKeys: [13, 44],
	    delimiter: ',',
	    delimiterRegex: null,
	    cancelConfirmKeysOnEmpty: false,
	    onTagExists: function onTagExists(item, $tag) {
	      return $tag.hide().fadeIn();
	    },
	    trimValue: false,
	    allowDuplicates: false
	  };
	
	  /**
	   * Constructor function
	   */
	  function BioInput(element, options) {
	    this.isInit = true;
	    this.itemsArray = [];
	
	    this.$element = $(element);
	    this.$element.hide();
	
	    this.objectItems = options && options.itemValue;
	    this.placeholderText = element.hasAttribute('placeholder') ? this.$element.attr('placeholder') : '';
	    this.inputSize = Math.max(1, this.placeholderText.length);
	
	    this.$container = $('<div class="bioinput"></div>');
	    this.$tagList = $('<ul class="bioinput-tag-list"></ul>').appendTo(this.$container);
	    this.$input = $('<input type="text" placeholder="' + this.placeholderText + '"/>').appendTo(this.$container);
	
	    this.$element.before(this.$container);
	
	    this.build(options);
	    this.isInit = false;
	  }
	
	  BioInput.prototype = {
	    constructor: BioInput,
	
	    /**
	     * Adds the given item as a new tag. Pass true to dontPushVal to prevent
	     * updating the elements val()
	     */
	    add: function add(inputItem, dontPushVal, options) {
	      var self = this;
	      var itemsArray = self.itemsArray;
	      var objectItems = self.objectItems;
	      var $element = self.$element;
	      var $container = self.$container;
	      var $tagList = self.$tagList;
	      var $input = self.$input;
	      var isInit = self.isInit;
	
	      var opts = this.options;
	
	      var item = typeof inputItem === 'string' && opts.trimValue ? $.trim(inputItem) : inputItem;
	
	      if (opts.maxTags && itemsArray.length >= opts.maxTags) {
	        return;
	      }
	
	      // Ignore falsey values, except false
	      if (item !== false && !item) {
	        return;
	      }
	
	      // Throw an error when trying to add an object while the itemValue option was not set
	      if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object' && !objectItems) {
	        throw new Error('Can\'t add objects when itemValue option is not set');
	      }
	
	      // // Ignore strings only containing whitespace
	      if (item.toString().match(/^\s*$/)) {
	        return;
	      }
	
	      if (typeof item === 'string' && $element[0].tagName === 'INPUT') {
	        var delimiter = opts.delimiterRegex ? opts.delimiterRegex : opts.delimiter;
	        var itemsArr = item.split(delimiter);
	        if (itemsArr.length > 1) {
	          $.each(itemsArr, function (index, splitItem) {
	            self.add(splitItem, true);
	          });
	          if (!dontPushVal) {
	            self.pushVal();
	          }
	          return;
	        }
	      }
	
	      var itemValue = opts.itemValue(item);
	      var itemText = opts.itemText(item);
	      var tagClass = opts.tagClass(item);
	      var itemTitle = opts.itemTitle(item);
	
	      // Ignore items already added
	      var existing = $.inArray(itemValue, itemsArray);
	      if (existing && !opts.allowDuplicates) {
	        // Invoke onTagExists
	        if (opts.onTagExists) {
	          var $existingTag = $('.tag', $container).filter(function f() {
	            return $(this).data('item') === existing;
	          });
	          opts.onTagExists(item, $existingTag);
	        }
	        return;
	      }
	
	      // if length greater than limit
	      if (self.items().toString().length + item.length + 1 > opts.maxInputLength) {
	        return;
	      }
	
	      // raise beforeItemAdd arg
	      var beforeItemAddEvent = new $.Event('beforeItemAdd', { item: item, cancel: false, options: options });
	      $element.trigger(beforeItemAddEvent);
	      if (beforeItemAddEvent.cancel) {
	        return;
	      }
	
	      // register item in internal array and map
	      itemsArray.push(item);
	
	      // add a tag element
	      var $tag = $('<li class="tag ' + htmlEncode(tagClass) + (itemTitle !== null ? '" title="' + itemTitle : '') + '">' + htmlEncode(itemText) + '<span data-role="remove"></span></li>');
	      $tag.data('item', item);
	      $tagList.append($tag);
	      $tag.after(' ');
	
	      // Remove the 'tag-to-remove' class
	      $('.tag').each(function () {
	        $(this).removeClass('tag-to-remove');
	      });
	
	      if (!dontPushVal) {
	        self.pushVal();
	      }
	
	      // Add class when reached maxTags
	      if (opts.maxTags === itemsArray.length || self.items().toString().length === opts.maxInputLength) {
	        $container.addClass('bioinput-max');
	      }
	
	      // If using typeahead, once the tag has been added, clear the
	      // typeahead value so it does not stick around in the input.
	      if ($('.typeahead, .twitter-typeahead', $container).length) {
	        $input.typeahead('val', '');
	      }
	
	      if (isInit) {
	        $element.trigger(new $.Event('itemAddedOnInit', { item: item, options: options }));
	      } else {
	        $element.trigger(new $.Event('itemAdded', { item: item, options: options }));
	      }
	    },
	
	    /**
	     * Removes the given item. Pass true to dontPushVal to prevent updating the
	     * elements val()
	     */
	    remove: function remove(itemToRemove, dontPushVal, options) {
	      var item = itemToRemove;
	      var self = this;
	      var objectItems = self.objectItems;
	      var $element = self.$element;
	      var $container = self.$container;
	      var itemsArray = self.itemsArray;
	
	      var opts = this.options;
	
	      if (objectItems) {
	        (function () {
	          var itemToFind = (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object' ? opts.itemValue(item) : item;
	          item = $.grep(itemsArray, function (other) {
	            return opts.itemValue(other) === itemToFind;
	          });
	          item = item[item.length - 1];
	        })();
	      }
	
	      if (item) {
	        var beforeRemoveE = new $.Event('beforeItemRemove', { item: item, cancel: false, options: options });
	        $element.trigger(beforeRemoveE);
	        if (beforeRemoveE.cancel) {
	          return;
	        }
	
	        $('.tag', $container).filter(function f() {
	          return $(this).data('item') === item;
	        }).remove();
	
	        if ($.inArray(item, itemsArray) !== -1) {
	          itemsArray.splice($.inArray(item, itemsArray), 1);
	        }
	      }
	
	      if (!dontPushVal) {
	        self.pushVal();
	      }
	
	      // Remove class when reached maxTags
	      if (opts.maxTags > itemsArray.length) {
	        $container.removeClass('bioinput-max');
	      }
	
	      $element.trigger(new $.Event('itemRemoved', { item: item, options: options }));
	    },
	
	    /**
	     * Removes all items
	     */
	    removeAll: function removeAll() {
	      var $container = this.$container;
	      var itemsArray = this.itemsArray;
	
	      $('.tag', $container).remove();
	      // http://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
	      itemsArray.splice(0, itemsArray.length);
	      this.pushVal();
	    },
	
	    /**
	     * Refreshes the tags so they match the text/value of their corresponding
	     * item.
	     */
	    refresh: function refresh() {
	      var $container = this.$container;
	      var options = this.options;
	
	      $('.tag', $container).each(function each() {
	        var $tag = $(this);
	        var item = $tag.data('item');
	        var itemText = options.itemText(item);
	        var tagClass = options.tagClass(item);
	
	        // Update tag's class and inner text
	        $tag.attr('class', null);
	        $tag.addClass('tag ' + htmlEncode(tagClass));
	        $tag.contents().filter(function f() {
	          return this.nodeType === 3;
	        })[0].nodeValue = htmlEncode(itemText);
	      });
	    },
	
	    /**
	     * Returns the items added as tags
	     */
	    items: function items() {
	      return this.itemsArray;
	    },
	
	    /**
	     * Assembly value by retrieving the value of each item, and set it on the
	     * element.
	     */
	    pushVal: function pushVal() {
	      var items = this.items;
	      var options = this.options;
	      var $element = this.$element;
	
	      var val = $.map(items(), function (item) {
	        return options.itemValue(item).toString();
	      });
	      $element.val(val, true).trigger('change');
	    },
	
	    /**
	     * Initializes the tags input behaviour on the element
	     */
	    build: function build(options) {
	      var self = this;
	      var objectItems = self.objectItems;
	      var $input = self.$input;
	      var $element = self.$element;
	      var $container = self.$container;
	
	      self.options = _extends({}, defaultOptions, options);
	      var opts = self.options;
	      // When itemValue is set, freeInput should always be false
	      opts.freeInput = !objectItems;
	
	      makeOptionItemFunction(opts, 'itemValue');
	      makeOptionItemFunction(opts, 'itemText');
	      makeOptionFunction(opts, 'tagClass');
	
	      var autocomplete = opts.autocomplete;
	      if (autocomplete) {
	        (function () {
	          // Determine if main configurations were passed or simply a dataset
	          var acConfig = $.isArray(autocomplete) ? autocomplete[0] : null;
	          var datasets = $.isArray(autocomplete) ? autocomplete[1] : autocomplete;
	
	          $input.typeahead(acConfig, datasets).on('typeahead:selected', $.proxy(function (obj, datum) {
	            self.add(datasets.valueKey ? datum[datasets.valueKey] : datum);
	            $input.typeahead('val', '');
	          }, self));
	        })();
	      }
	
	      $container.on('click', $.proxy(function () {
	        if (!$element.attr('disabled')) {
	          $input.removeAttr('disabled');
	        }
	        $input.focus();
	      }, self));
	
	      if (opts.addOnBlur && opts.freeInput) {
	        $input.on('focusout', $.proxy(function () {
	          // HACK: only process on focusout when no typeahead opened, to
	          //       avoid adding the typeahead text as tag
	          if ($('.typeahead, .twitter-typeahead', $container).length === 0) {
	            self.add($input.val());
	            $input.val('');
	          }
	        }, self));
	      }
	
	      // Toggle the 'focus' css class on the container when it has focus
	      $container.on({
	        focusin: function focusin() {
	          return $container.addClass(opts.focusClass);
	        },
	        focusout: function focusout() {
	          return $container.removeClass(opts.focusClass);
	        }
	      });
	
	      var lastKeyPressed = 0;
	      $container.on('keydown', 'input', $.proxy(function (event) {
	        var $targetInput = $(event.target);
	        var $tag = $('.bioinput-label');
	
	        if ($element.attr('disabled')) {
	          $input.attr('disabled', 'disabled');
	          return;
	        }
	
	        // Backspace pressed and cursor at beginning of input.
	        if (event.which === 8 && getCaretPosition($targetInput[0]) === 0) {
	          var last = $tag.last();
	          if (last.length && lastKeyPressed === 8) {
	            self.remove(last.data('item'));
	            lastKeyPressed = 0;
	          } else if (last.length) {
	            last.addClass('tag-to-remove');
	            lastKeyPressed = 8;
	          }
	        } else {
	          // Reset last key pressed and remove 'tag-to-remove' class
	          lastKeyPressed = 0;
	          $('.tag').each(function each() {
	            $(this).removeClass('tag-to-remove');
	          });
	        }
	      }, self));
	
	      $container.on('keypress', 'input', $.proxy(function (event) {
	        var $targetInput = $(event.target);
	
	        if ($element.attr('disabled')) {
	          $input.attr('disabled', 'disabled');
	          return;
	        }
	
	        var text = $targetInput.val();
	        var maxLengthReached = opts.maxChars && text.length >= opts.maxChars;
	        if (opts.freeInput && (keyCombinationInList(event, opts.confirmKeys) || maxLengthReached)) {
	          // Only attempt to add a tag if there is data in the field
	          if (text.length !== 0) {
	            var textToAdd = maxLengthReached ? text.substr(0, opts.maxChars) : text;
	            self.add(textToAdd);
	            $targetInput.val('');
	          }
	
	          // If the field is empty, let the event triggered fire as usual
	          if (opts.cancelConfirmKeysOnEmpty === false) {
	            event.preventDefault();
	          }
	        }
	
	        // Reset internal input's size
	        var textLength = $input.val().length + 1;
	
	        $targetInput.attr('size', Math.max(this.inputSize, textLength));
	      }, self));
	
	      // Remove icon clicked
	      $container.on('click', '[data-role=remove]', $.proxy(function (event) {
	        if (!$element.attr('disabled')) {
	          self.remove($(event.target).closest('.tag').data('item'));
	        }
	      }, self));
	
	      // Only add existing value as tags when using strings as tags
	      if (opts.itemValue === defaultOptions.itemValue) {
	        if ($element[0].tagName === 'INPUT') {
	          self.add($element.val());
	        } else {
	          $('option', $element).each(function each() {
	            self.add($(this).attr('value'), true);
	          });
	        }
	      }
	    },
	
	    /**
	     * Removes all bioinput behavior and unregister all event handlers
	     */
	    destroy: function destroy() {
	      var $container = this.$container;
	      var $element = this.$element;
	
	      // Unbind events
	
	      $container.off('keypress', 'input');
	      $container.off('click', '[role=remove]');
	
	      $container.remove();
	      $element.removeData('bioinput');
	      $element.show();
	    },
	
	    /**
	     * Sets focus on the bioinput
	     */
	    focus: function focus() {
	      this.$input.focus();
	    },
	
	    /**
	     * Returns the internal input element
	     */
	    input: function input() {
	      return this.$input;
	    },
	
	    /**
	     * Returns the element which is wrapped around the internal input. This
	     * is normally the $container, but typeahead.js moves the $input element.
	     */
	    findInputWrapper: function findInputWrapper() {
	      var elt = this.$input[0];
	      var container = this.$container[0];
	      while (elt && elt.parentNode !== container) {
	        elt = elt.parentNode;
	      }
	      return $(elt);
	    }
	  };
	
	  /**
	   * Register JQuery plugin
	   */
	  $.fn.bioinput = function (arg1, arg2, arg3) {
	    var results = [];
	    this.each(function each() {
	      var bioinput = $(this).data('bioinput');
	      // Initialize a new tags input
	      if (!bioinput) {
	        bioinput = new BioInput(this, arg1);
	        $(this).data('bioinput', bioinput);
	        results.push(bioinput);
	
	        // Init tags from $(this).val()
	        $(this).val($(this).val());
	      } else if (!arg1 && !arg2) {
	        // bioinput already exists
	        // no function, trying to init
	        results.push(bioinput);
	      } else if (bioinput[arg1] !== undefined) {
	        // Invoke function on existing tags input
	        var retVal = undefined;
	        if (bioinput[arg1].length === 3 && arg3 !== undefined) {
	          retVal = bioinput[arg1](arg2, null, arg3);
	        } else {
	          retVal = bioinput[arg1](arg2);
	        }
	        if (retVal) {
	          results.push(retVal);
	        }
	      }
	    });
	
	    if (typeof arg1 === 'string') {
	      // Return the results from the invoked function calls
	      return results.length > 1 ? results : results[0];
	    }
	    return results;
	  };
	
	  $.fn.bioinput.Constructor = BioInput;
	
	  var bHOpts = {
	    queryTokenizer: Bloodhound.tokenizers.whitespace,
	    datumTokenizer: Bloodhound.tokenizers.whitespace,
	    remote: {
	      url: '',
	      wildcard: '%QUERY',
	      transform: function transform(response) {
	        return $.map(response, function (lineObj) {
	          return lineObj.name;
	        });
	      }
	    }
	  };
	
	  var assayEngine = new Bloodhound(_extends({}, bHOpts, {
	    remote: _extends({}, bHOpts.remote, {
	      url: 'http://amp.pharm.mssm.edu/LDR/api/autocomplete/assays?q=%QUERY'
	    })
	  }));
	
	  var cellLineEngine = new Bloodhound(_extends({}, bHOpts, {
	    remote: _extends({}, bHOpts.remote, {
	      url: 'http://amp.pharm.mssm.edu/LDR/api/autocomplete/cellLines?q=%QUERY'
	    })
	  }));
	
	  $(function () {
	    $('input[data-role=bioinput][data-entity-type=assay]').bioinput({
	      autocomplete: {
	        source: assayEngine
	      }
	    });
	    $('input[data-role=bioinput][data-entity-type=cell]').bioinput({
	      autocomplete: {
	        source: cellLineEngine
	      }
	    });
	  });
	})(window.jQuery, window.Bloodhound);

/***/ }
/******/ ]);
//# sourceMappingURL=bioinput.final.js.map