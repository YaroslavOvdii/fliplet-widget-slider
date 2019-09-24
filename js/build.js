var globalSwiper = {};
var slideTemplate = Fliplet.Widget.Templates['template.slide'];
var deletedAllSlides = false;
function init() {
  $('[data-onboarding-id]').each(function(){
    var container = this;
    var id = $(container).data('onboarding-id');
    var config = Fliplet.Widget.getData(id);
    var swiperElement = $(container).find('.swiper-container');
    var swiper = new Swiper( swiperElement, {
      direction: 'horizontal',
      loop: false,
      autoHeight: true,
      pagination: '.swiper-pagination-' + id,
      paginationClickable: true,
      nextButton: '.swiper-button-next-' + id,
      prevButton: '.swiper-button-prev-' + id,
      grabCursor: true,
      onSlideChangeEnd: function () {
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

    //To control multiple sliders on the same screen
    globalSwiper[id] = swiper;

    swiper.update();

    $(window).on('resize', function() {
      swiper.update();
    });

    Fliplet.Hooks.on('appearanceChanged', function () {
      swiper.update();
    });

    Fliplet.Hooks.on('restorePageContext', function (pageContext) {
      if(pageContext && pageContext[id]){
        swiper.slideTo(pageContext[id]);
      }
    });

    $(container).find('.ob-skip span').click(function () {
      var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder').data('onboarding-id') );

      if(!_.isUndefined(data) && (!_.isUndefined(data.skipLinkAction) && !_.isEmpty(data.skipLinkAction))) {
        Fliplet.Navigate.to(data.skipLinkAction);
      }
    });

    $(container).find('.btn[data-slide-button-id]').click(function (event) {
      event.preventDefault();

      var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder').data('onboarding-id') );
      var itemData = _.find(data.items,{id: $(this).data('slide-button-id')});

      if(!_.isUndefined(itemData) && (!_.isUndefined(itemData.linkAction) && !_.isEmpty(itemData.linkAction))) {
        Fliplet.Navigate.to(itemData.linkAction);
      }
    });

  });
}

// Cheking if user changed array order in interface
function hasArrayChangedOrder(domArray, newArray) {
  var changed = false;

  domArray.each(function(index, element) {
    if ( element.dataset.sliderId !== newArray[index].id ) {
      changed = true;
      return false;
    }
  });

  return changed;
}

// Drawing slides according to new array order
function reDrawAllSlides(data, widgetId) {
  globalSwiper[widgetId].removeAllSlides();

  _.forEach(data, function (item) {
    globalSwiper[widgetId].appendSlide('<div class="swiper-slide" data-slider-id="'+item.id+'"></div>');
  });
}

// Main fanction to update and show slides
function updateSlide (data, widgetId, activeSlide) {
  var $slidesInDom = $('[data-onboarding-id='+widgetId+'] .swiper-container [data-slider-id]');

  // Reload widget build only if we deleted all slides or we init new slider on the same screen or after we deleted all slides and start to add the again
  if (!globalSwiper[widgetId] || !data.length || deletedAllSlides) {
    Fliplet.Studio.emit('reload-widget-instance', widgetId);
    deletedAllSlides = !data.length;
    return;
  }

  var currentSlide = activeSlide !== undefined ? activeSlide : globalSwiper[widgetId].activeIndex;
  
  if ($slidesInDom.length === data.length) {
    if (hasArrayChangedOrder($slidesInDom, data)) {
      reDrawAllSlides(data, widgetId);
    }
  } else if ($slidesInDom.length < data.length) {
    globalSwiper[widgetId].appendSlide('<div class="swiper-slide" data-slider-id="'+data[data.length-1].id+'"></div>');
    currentSlide = data.length - 1;
  }else { 
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
    $('[data-slider-id='+item.id+']').html(newTemplate);
  });

  globalSwiper[widgetId].updateAutoHeight(500);
  globalSwiper[widgetId].slideTo(currentSlide, 500, false);
}

var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {
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