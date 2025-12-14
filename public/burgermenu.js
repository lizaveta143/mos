document.addEventListener('DOMContentLoaded', function () {
  var menu = document.getElementById('i9yl3i15f_0');
  var burger = document.getElementById('i8bwd3e8x_0');
  var closeBtn = document.getElementById('iq8elmdv3_0');
  var overlay = document.getElementById('isynujaxa_0');

  if (!menu || !burger) return;

  function openMenu() {
    menu.classList.add('is-opened');
    if (overlay) overlay.style.display = 'block';
  }

  function closeMenu() {
    menu.classList.remove('is-opened');
    if (overlay) overlay.style.display = 'none';
  }

  burger.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);
});