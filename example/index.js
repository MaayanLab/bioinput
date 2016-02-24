/* eslint-disable */
$(function() {
  $('input').on('change', function() {

    $('.assay-val').html(JSON.stringify($('#assay').bioinput('entities')));
    $('.cell-val').html(JSON.stringify($('#cell').bioinput('entities')));
    $('.disease-val').html(JSON.stringify($('#disease').bioinput('entities')));
    $('.drug-val').html(JSON.stringify($('#drug').bioinput('entities')));
    $('.gene-val').html(JSON.stringify($('#gene').bioinput('entities')));
    $('.organism-val').html(JSON.stringify($('#organism').bioinput('entities')));

  }).trigger('change');
});
