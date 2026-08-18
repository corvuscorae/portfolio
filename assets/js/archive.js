const artLightbox = document.querySelector('#art-lightbox');
const artLightboxImage = document.querySelector('#art-lightbox-image');
const artLightboxTitle = document.querySelector('#art-lightbox-title');
const artLightboxMedium = document.querySelector('#art-lightbox-medium');
const artButtons = Array.from(document.querySelectorAll('[data-art-src]'));
const seriesButtons = Array.from(document.querySelectorAll('[data-series-dialog]'));
const artDialogs = Array.from(document.querySelectorAll('.art-lightbox'));

artButtons.forEach((button) => {
	button.addEventListener('click', () => {
		artLightboxImage.src = button.dataset.artSrc;
		artLightboxImage.alt = button.querySelector('img').alt;
		artLightboxTitle.textContent = button.dataset.artTitle;
		artLightboxMedium.textContent = button.dataset.artMedium;
		artLightbox.showModal();
		document.body.classList.add('dialog-open');
	});
});

seriesButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const dialog = document.getElementById(button.dataset.seriesDialog);
		dialog.showModal();
		document.body.classList.add('dialog-open');
	});
});

artDialogs.forEach((dialog) => {
	dialog.querySelector('.art-lightbox-close').addEventListener('click', () => {
		dialog.close();
	});

	dialog.addEventListener('click', (event) => {
		const bounds = dialog.getBoundingClientRect();
		const clickedBackdrop = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;

		if (clickedBackdrop) {
			dialog.close();
		}
	});

	dialog.addEventListener('close', () => {
		document.body.classList.remove('dialog-open');
	});
});
