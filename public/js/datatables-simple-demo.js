let myTable
window.addEventListener('DOMContentLoaded', event => {
    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        myTable = new simpleDatatables.DataTable(datatablesSimple);
        
        myTable.on('datatable.init', function() {
            let savedPage = sessionStorage.getItem('dt_saved_page');
            if (savedPage) {
                setTimeout(() => {
                    myTable.page(parseInt(savedPage));
                    sessionStorage.removeItem('dt_saved_page');
                }, 50);
            }
        });
    }
});
