(function() {
  var globalSwiper = {};
  var slideTemplate = Fliplet.Widget.Templates['template.slide'];

  // Drawing slides according to new array order
  function reDrawAllSlides(data, widgetId) {
    globalSwiper[widgetId].removeAllSlides();

    _.forEach(data, function(item) {
      globalSwiper[widgetId].appendSlide('<div class="swiper-slide" data-slider-id="' + item.id + '"></div>');
    });
  }

  // Cheking if user changed array order in interface
  function hasArrayChangedOrder(domArray, newArray) {
    return _.some(domArray, function(element, index) {
      return element.dataset.sliderId !== newArray[index].id;
    });
  }

  Fliplet.Widget.instance('slider', function(data) {
    var $container = $(this);
    var deletedAllSlides = false;

    // Setting container parent max-width to 100% so that the swiper library set correct slide width
    // To work with old D&D
    $container.parents('.column-item').css('maxWidth', '100%')

    // To work with new D&D
    $container.parent().css('maxWidth', '100%');

    function authenticateImages(onImageLoad) {
      return Fliplet().then(function() {
        _.forEach(data.items, function(item) {
          if (!_.get(item, 'imageConf.url') || !Fliplet.Media.isRemoteUrl(item.imageConf.url)) {
            return;
          }

          var $img = $container.find('.swiper-slide[data-slide-id="' + item.id + '"] .swiper-slide-image');

          if (typeof onImageLoad === 'function') {
            $img.on('load', onImageLoad);
          }

          $img.attr('src', Fliplet.Media.authenticate(item.imageConf.url));
        });
      });
    }

    function init() {
      var id = data.id;
      var swiperElement = $container.find('.swiper-container');
      var swiper = new Swiper(swiperElement, {
        direction: 'horizontal',
        loop: false,
        autoHeight: true,
        pagination: '.swiper-pagination-' + id,
        paginationClickable: true,
        nextButton: '.swiper-button-next-' + id,
        prevButton: '.swiper-button-prev-' + id,
        grabCursor: true,
        onSlideChangeEnd: function() {
          /**
           * get current page context if any
           */
          var existingPageContext = Fliplet.Page.Context.get() || {};
          /**
           * use a direct access data structure for faster lookup later
           * store the current slider context under the slider's id
           */
          var slidersContext = existingPageContext.sliders || {};

          slidersContext[id] = swiper.activeIndex;
          Fliplet.Page.Context.set(_.assign(existingPageContext, slidersContext));
        }
      });

      // To control multiple sliders on the same screen
      globalSwiper[id] = swiper;

      authenticateImages(swiper.update);
      swiper.update();

      $(window).on('resize', function() {
        swiper.update();
      });

      Fliplet.Hooks.on('appearanceChanged', function() {
        swiper.update();
      });

      Fliplet.Hooks.on('restorePageContext', function(pageContext) {
        if (pageContext && pageContext[id]) {
          swiper.slideTo(pageContext[id]);
        }
      });

      $container.find('.ob-skip span').click(function() {
        if (_.get(data, 'skipLinkAction') && !_.isEmpty(data.skipLinkAction)) {
          Fliplet.Navigate.to(data.skipLinkAction);
        }
      });

      $container.find('.btn[data-slide-button-id]').click(function(event) {
        event.preventDefault();

        var itemData = _.find(data.items, {id: $(this).data('slide-button-id')});

        if (_.get(itemData, 'linkAction') && !_.isEmpty(itemData.linkAction)) {
          Fliplet.Navigate.to(itemData.linkAction);
        }
      });
    }

    // Main fanction to update and show slides
    function updateSlide(data, widgetId, activeSlide) {
      // When we open interface we have 2 data-slider-id elements that's why we take only first of them.
      var $slidesInDom = $('[data-slider-id=' + widgetId + ']:eq(0)').find('.swiper-container [data-slider-id]');

      // Reload widget build only if we deleted all slides or we init new slider on the same screen or after we deleted all slides and start to add the again
      if (!globalSwiper[widgetId] || !data.length || deletedAllSlides) {
        Fliplet.Studio.emit('reload-widget-instance', widgetId);
        deletedAllSlides = !data.length;
        return;
      }

      var currentSlide = !activeSlide ? activeSlide : globalSwiper[widgetId].activeIndex;

      if ($slidesInDom.length === data.length) {
        if (hasArrayChangedOrder($slidesInDom, data)) {
          reDrawAllSlides(data, widgetId);
        }
      } else if ($slidesInDom.length < data.length) {
        globalSwiper[widgetId].appendSlide('<div class="swiper-slide" data-slider-id="' + data[data.length - 1].id + '"></div>');
        currentSlide = data.length - 1;
      } else {
        var deletedPosition;

        $slidesInDom.each(function(index, element) {
          if (!data[index] || element.dataset.sliderId !== data[index].id) {
            globalSwiper[widgetId].removeSlide(index);
            deletedPosition = index;
            return false;
          }
        });

        if (deletedPosition === ($slidesInDom.length - 1)) {
          currentSlide = deletedPosition - 1;
        } else {
          currentSlide = deletedPosition;
        }
      }

      _.forEach(data, function(item) {
        var newTemplate = slideTemplate(item);

        $('[data-slider-id=' + item.id + ']').html(newTemplate);
      });

      globalSwiper[widgetId].slideTo(currentSlide, 500, false);
      globalSwiper[widgetId].updateAutoHeight(0);

      if (data[currentSlide].imageConf) {
        // This is needed to update slide size when we adding an image
        // Wait until image is loaded and then update height one more time
        var imageLoad = new Promise(function(resolve) {
          var image = new Image();

          image.onload = function() {
            resolve();
          };
          image.src = data[currentSlide].imageConf.url;
        });

        imageLoad.then(function() {
          globalSwiper[widgetId].updateAutoHeight();
        });
      }
    }

    var debounceLoad = _.debounce(init, 500);

    Fliplet.Studio.onEvent(function(event) {
      var eventDetail = event.detail;

      if (eventDetail.event === 'reload-widget-instance') {
        debounceLoad();
        return;
      }

      if (eventDetail.type === 'updateSlide') {
        updateSlide(eventDetail.data, eventDetail.widgetId, eventDetail.index);
      }
    });

    init();

    // Trigger resize event so that the library set correct slide width according to the $container
    $(window).trigger('resize');
  });
})();
