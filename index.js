/* eslint-disable */
$(function() {
  $('input').on('change', function() {

    $('.assay-val').html(JSON.stringify($('#assay').bioinput('items')));
    $('.cell-val').html(JSON.stringify($('#cell').bioinput('items')));

  }).trigger('change');
});
