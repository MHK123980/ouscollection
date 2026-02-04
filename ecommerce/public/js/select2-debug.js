// Debug script for Select2 category dropdown
console.log('Select2 Debug Script Loaded');

$(document).ready(function() {
  console.log('=== SELECT2 DEBUG INFO ===');
  
  // Check if Select2 library is loaded
  console.log('Select2 loaded:', typeof $.fn.select2 !== 'undefined');
  
  // Check for category selects
  const categorySelects = $('.category-select');
  console.log('Category select elements found:', categorySelects.length);
  
  // Check options in each select
  categorySelects.each(function(index) {
    const optionCount = $(this).find('option').length;
    const optgroupCount = $(this).find('optgroup').length;
    console.log(`Select ${index}: ${optionCount} options, ${optgroupCount} optgroups`);
    
    // Log first few options
    $(this).find('option').slice(0, 3).each(function() {
      console.log(`  - ${$(this).text()}: ${$(this).val()}`);
    });
  });
  
  // Check if modals exist
  console.log('Add Product modal exists:', $('#addProduct').length > 0);
  console.log('Edit modals found:', $('[id^="edit-"]').length);
  
  // Monitor modal events
  $(document).on('show.bs.modal', function(e) {
    console.log('Modal shown:', $(e.target).attr('id'));
    const select = $(e.target).find('.category-select');
    if (select.length) {
      console.log('Category select in this modal, options:', select.find('option').length);
    }
  });
  
  console.log('=== END DEBUG ===');
});
