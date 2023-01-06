'use strict';

const clearInputIcons = document.querySelectorAll('.clear-input-icon');

clearInputIcons.forEach((icon) => icon.addEventListener('mousedown', (e) => {
  e.preventDefault();
  const input =
  document.querySelector(`input#${e.currentTarget.dataset.input}`);
  input.value = '';
  input.focus();
}));
