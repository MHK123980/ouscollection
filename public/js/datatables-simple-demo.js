let myTable;
window.addEventListener('DOMContentLoaded', event => {
    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        myTable = new simpleDatatables.DataTable(datatablesSimple);
        
        // Wait a short moment to ensure the table and pagination DOM are fully rendered
        setTimeout(() => {
            let savedPage = sessionStorage.getItem('dt_saved_page');
            if (savedPage) {
                let success = false;
                
                // Method 1: Try the simpleDatatables API
                try {
                    // page() is usually 1-based or 0-based depending on version
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
    }
});
