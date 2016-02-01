/* eslint-disable */
$(function() {
  $('input').on('change', function() {

    $('.assay-val').html(JSON.stringify($('#assay').bioinput('entities')));
    $('.cell-val').html(JSON.stringify($('#cell').bioinput('entities')));

  }).trigger('change');
});
