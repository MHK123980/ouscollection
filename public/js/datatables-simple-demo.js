let myTable;
window.addEventListener('DOMContentLoaded', event => {
    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        // Show a loading overlay while the table processes
        const overlay = document.getElementById('pageLoadOverlay');
        if (overlay) overlay.style.display = 'flex';

        // Use requestAnimationFrame so the overlay renders before heavy DataTable work
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            myTable = new simpleDatatables.DataTable(datatablesSimple, {
                perPage: 15,
                perPageSelect: [10, 15, 25, 50],
                searchable: true,
                sortable: true,
                columns: [
                    { select: 0, sortable: false },   // Select checkbox col
                    { select: 1, sortable: false },   // Image col
                    { select: 9, sortable: false },   // Action col (last col)
                ]
            });
            if (overlay) overlay.style.display = 'none';
        
            // Wait a short moment to ensure the table and pagination DOM are fully rendered
            setTimeout(() => {
                let savedPage = sessionStorage.getItem('dt_saved_page');
                if (savedPage) {
                    let success = false;
                    
                    // Method 1: Try the simpleDatatables API
                    try {
                        myTable.page(parseInt(savedPage));
                        success = true;
                    } catch(e) {
                        console.log("Datatables API page() failed, trying fallback...");
                    }
                    
                    // Method 2: Fallback to simulating a click on the pagination link
                    if (!success || document.querySelector('.dataTable-pagination .active a').innerText.trim() !== String(savedPage)) {
                        const pageLinks = document.querySelectorAll('.dataTable-pagination a');
                        for (let link of pageLinks) {
                            let linkPage = link.dataset ? link.dataset.page : null;
                            if (!linkPage) linkPage = link.innerText.trim();
                            
                            if (linkPage === String(savedPage)) {
                                link.click();
                                break;
                            }
                        }
                    }
                    
                    sessionStorage.removeItem('dt_saved_page');
                }
            }, 150); // 150ms delay gives enough time for DOM injection
          });
        });
    }
});
