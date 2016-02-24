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
  $.get('http://amp.pharm.mssm.edu/biocomplete/api/v1/counts')
    .done(function(data) {
      $('.assay-count').html(JSON.stringify(data.assays));
      $('.cell-line-count').html(JSON.stringify(data.cellLines));
      $('.disease-count').html(JSON.stringify(data.diseases));
      $('.drug-count').html(JSON.stringify(data.drugs));
      $('.gene-count').html(JSON.stringify(data.genes));
      $('.organism-count').html(JSON.stringify(data.organisms));
    });
});
