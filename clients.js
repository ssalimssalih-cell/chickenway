function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    if (page === 'commander' && items[0]) items[0].classList.add('active');
    else if (page === 'historique' && items[1]) items[1].classList.add('active');
    else if (items[2]) items[2].classList.add('active');
    document.getElementById('clientPageTitle').textContent = page === 'commander' ? 'Commander' : page === 'historique' ? 'Historique' : 'Parametres';
    document.getElementById('clientDynamicContent').innerHTML = '<div class="content-card"><h3>' + (page === 'commander' ? 'Commander' : page === 'historique' ? 'Historique' : 'Parametres') + '</h3><p style="text-align:center;padding:40px;">A venir</p></div>';
}
