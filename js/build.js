$('.ob-skip').click(function (event) {
  event.preventDefault();

  var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder[data-onboarding-id]').attr('data-onboarding-id') );

  if(!_.isUndefined(data) && (!_.isUndefined(data.skipLinkAction) && !_.isEmpty(data.skipLinkAction))) {
    Fliplet.Navigate.to(data.skipLinkAction);
  }
});

$('.btn[data-slide-button-id]').click(function (event) {
  event.preventDefault();

  var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder[data-onboarding-id]').attr('data-onboarding-id') );
  var itemData = _.find(data.items,{id: $(this).data('slide-button-id')});

  if(!_.isUndefined(itemData) && (!_.isUndefined(itemData.linkAction) && !_.isEmpty(itemData.linkAction))) {
    Fliplet.Navigate.to(itemData.linkAction);
  }
});

$('[data-onboarding-id]').each(function(){

  var swiperElement = $(this).find('.swiper-container');
  var swiper = new Swiper( swiperElement, {
    direction: 'horizontal',
    loop: false,
    autoHeight: true,

  	pagination: '.swiper-pagination',
    paginationClickable: true,
    nextButton: '.swiper-button-next',
    prevButton: '.swiper-button-prev',
    grabCursor: true
  });

});
