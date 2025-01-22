
// Gestion du bouton "Acheter" et "Vendre"
buyBtn.addEventListener('click', () => {
  buyBtn.classList.add('active-buy');
  sellBtn.classList.remove('active-sell');
  buyWindow.classList.remove('hidden');
  sellWindow.classList.add('hidden');
});

sellBtn.addEventListener('click', () => {
  sellBtn.classList.add('active-sell');
  buyBtn.classList.remove('active-buy');
  sellWindow.classList.remove('hidden');
  buyWindow.classList.add('hidden');
});

