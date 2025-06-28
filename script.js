document.addEventListener('DOMContentLoaded', function() {
        const navbarToggle = document.getElementById('navbar-toggle');
        const navbarContent = document.getElementById('navbar-content');

        if (navbarToggle && navbarContent) {
            navbarToggle.addEventListener('click', function() {
                navbarContent.classList.toggle('hidden'); // Menambah/menghapus class 'hidden'
                navbarContent.classList.toggle('flex'); // Mengganti display dari 'hidden' ke 'flex' atau sebaliknya
            });
        }
    });