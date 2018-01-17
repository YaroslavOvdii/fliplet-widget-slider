$('.ob-skip span').click(function () {
  var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder').data('onboarding-id') );

  if(!_.isUndefined(data) && (!_.isUndefined(data.skipLinkAction) && !_.isEmpty(data.skipLinkAction))) {
    Fliplet.Navigate.to(data.skipLinkAction);
  }
});

$('.btn[data-slide-button-id]').click(function (event) {
  event.preventDefault();

  var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder').data('onboarding-id') );
  var itemData = _.find(data.items,{id: $(this).data('slide-button-id')});

  if(!_.isUndefined(itemData) && (!_.isUndefined(itemData.linkAction) && !_.isEmpty(itemData.linkAction))) {
    Fliplet.Navigate.to(itemData.linkAction);
  }
});

function init(){
  $('[data-onboarding-id]').each(function(){

    var swiperElement = $(this).find('.swiper-container');
    var swiper = new Swiper( swiperElement, {
      direction: 'horizontal',
      loop: false,
      autoHeight: true,

      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      grabCursor: true,
      on: {
        touchStart: function(event) {
          event.stopPropagation();
        }
      }
    });

    swiper.updateSize();

  });
}
var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {
  if (event.detail.event === 'reload-widget-instance') {
    debounceLoad();
  }
});
init();
