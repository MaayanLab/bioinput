/* eslint-disable */
$(function() {
  $('input').on('change', function() {
    $('.assay-val').html(JSON.stringify($('#assay').bioinput('entities')));
    $('.cell-val').html(JSON.stringify($('#cell').bioinput('entities')));
  }).trigger('change');
  $.get('http://amp.pharm.mssm.edu/biocomplete/api/v1/counts')
    .done(function(data) {
      $('.assay-count').html(JSON.stringify(data.assays));
      $('.cell-line-count').html(JSON.stringify(data.cellLines));
    });
});
