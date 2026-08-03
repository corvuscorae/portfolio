const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');
const navigationLinks = Array.from(navigation.querySelectorAll('a[href^="#"]'));

menuButton.addEventListener('click', () => {
	const isOpen = navigation.classList.toggle('open');
	menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigationLinks.forEach((link) => {
	link.addEventListener('click', () => {
		navigation.classList.remove('open');
		menuButton.setAttribute('aria-expanded', 'false');
	});
});

const sections = Array.from(document.querySelectorAll('main section[id]'));

const sectionObserver = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (!entry.isIntersecting) {
			return;
		}

		navigationLinks.forEach((link) => {
			link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
		});
	});
}, {
	rootMargin: '-35% 0px -55% 0px',
	threshold: 0
});

sections.forEach((section) => sectionObserver.observe(section));

const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
const projectCards = Array.from(document.querySelectorAll('.project-card'));

filterButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const filter = button.dataset.filter;

		filterButtons.forEach((filterButton) => {
			filterButton.classList.toggle('active', filterButton === button);
		});

		projectCards.forEach((card) => {
			const categories = card.dataset.categories.split(' ');
			card.hidden = filter !== 'all' && !categories.includes(filter);
		});
	});
});

const dialogButtons = Array.from(document.querySelectorAll('[data-dialog]'));
const dialogs = Array.from(document.querySelectorAll('.project-dialog'));

function openDialog(dialog) {
	dialog.showModal();
	document.body.classList.add('dialog-open');
}

function closeDialog(dialog) {
	dialog.close();
	document.body.classList.remove('dialog-open');
}

dialogButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const dialog = document.getElementById(button.dataset.dialog);
		openDialog(dialog);
	});
});

dialogs.forEach((dialog) => {
	dialog.querySelector('.dialog-close').addEventListener('click', () => closeDialog(dialog));

	dialog.addEventListener('click', (event) => {
		const bounds = dialog.getBoundingClientRect();
		const clickedBackdrop = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;

		if (clickedBackdrop) {
			closeDialog(dialog);
		}
	});

	dialog.addEventListener('close', () => {
		document.body.classList.remove('dialog-open');
	});
});

const hero = document.querySelector('.hero');
const heroCanvas = document.querySelector('#hero-interaction');

if (hero && heroCanvas) {
	const context = heroCanvas.getContext('2d');
	const cellSize = 18;
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const simulationInterval = reducedMotion ? 220 : 95;
	const renderInterval = 1000 / 30;
	const minimumPopulationRatio = 0.025;
	const minimumChangeRatio = 0.002;
	let columns = 0;
	let rows = 0;
	let canvasWidth = 0;
	let canvasHeight = 0;
	let tileWidth = cellSize;
	let tileHeight = cellSize;
	let cells = new Uint8Array(0);
	let nextCells = new Uint8Array(0);
	let charge = new Float32Array(0);
	let pointerX = 0;
	let pointerY = 0;
	let heroVisible = true;
	let lastSimulation = 0;
	let lastRender = 0;
	let lastReseed = 0;
	let stalledSteps = 0;

	const getIndex = (column, row) => row * columns + column;
	const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

	const setCell = (column, row, strength = 1) => {
		if (column < 0 || column >= columns || row < 0 || row >= rows) {
			return;
		}

		const index = getIndex(column, row);
		cells[index] = 1;
		charge[index] = Math.max(charge[index], strength);
	};

	const addSeed = (column, row, radius = 2, strength = 1) => {
		for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
			for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
				if ((offsetX * offsetX) + (offsetY * offsetY) > radius * radius) {
					continue;
				}

				if (Math.random() < 0.24) {
					continue;
				}

				setCell(column + offsetX, row + offsetY, strength);
			}
		}
	};

	const addGlider = (column, row, strength = 0.9) => {
		setCell(column + 1, row, strength);
		setCell(column + 2, row + 1, strength);
		setCell(column, row + 2, strength);
		setCell(column + 1, row + 2, strength);
		setCell(column + 2, row + 2, strength);
	};

	const addBlinker = (column, row, strength = 0.8) => {
		setCell(column - 1, row, strength);
		setCell(column, row, strength);
		setCell(column + 1, row, strength);
	};

	const seedGrid = () => {
		for (let row = 0; row < rows; row += 1) {
			for (let column = 0; column < columns; column += 1) {
				const index = getIndex(column, row);
				const horizontalPosition = column / Math.max(columns - 1, 1);
				const density = 0.08 + horizontalPosition * 0.08;
				const alive = Math.random() < density;

				cells[index] = alive ? 1 : 0;
				charge[index] = alive ? 0.5 + Math.random() * 0.5 : 0;
			}
		}

		addGlider(Math.floor(columns * 0.55), Math.floor(rows * 0.22));
		addGlider(Math.floor(columns * 0.72), Math.floor(rows * 0.62));
		addGlider(Math.floor(columns * 0.86), Math.floor(rows * 0.38));
		addBlinker(Math.floor(columns * 0.64), Math.floor(rows * 0.44));
		stalledSteps = 0;
	};

	const resizeHeroCanvas = () => {
		const bounds = hero.getBoundingClientRect();
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

		canvasWidth = Math.max(bounds.width, 1);
		canvasHeight = Math.max(bounds.height, 1);
		columns = Math.max(1, Math.ceil(canvasWidth / cellSize));
		rows = Math.max(1, Math.ceil(canvasHeight / cellSize));
		tileWidth = canvasWidth / columns;
		tileHeight = canvasHeight / rows;

		heroCanvas.width = Math.round(canvasWidth * pixelRatio);
		heroCanvas.height = Math.round(canvasHeight * pixelRatio);
		context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

		cells = new Uint8Array(columns * rows);
		nextCells = new Uint8Array(columns * rows);
		charge = new Float32Array(columns * rows);
		seedGrid();
		renderGrid();
	};

	const countNeighbors = (column, row) => {
		let neighbors = 0;

		for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
			for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
				if (offsetX === 0 && offsetY === 0) {
					continue;
				}

				const targetColumn = (column + offsetX + columns) % columns;
				const targetRow = (row + offsetY + rows) % rows;
				neighbors += cells[getIndex(targetColumn, targetRow)];
			}
		}

		return neighbors;
	};

	const updateGrid = () => {
		let nextPopulation = 0;
		let changedCells = 0;

		for (let row = 0; row < rows; row += 1) {
			for (let column = 0; column < columns; column += 1) {
				const index = getIndex(column, row);
				const neighbors = countNeighbors(column, row);
				const alive = cells[index] === 1;
				const survives = alive && (neighbors === 2 || neighbors === 3);
				const isBorn = !alive && neighbors === 3;
				const nextAlive = survives || isBorn;

				nextCells[index] = nextAlive ? 1 : 0;
				charge[index] = nextAlive
					? Math.min(1, Math.max(charge[index], isBorn ? 0.72 : 0.38) + 0.1)
					: Math.max(0, charge[index] - 0.2);
				nextPopulation += nextCells[index];

				if (nextAlive !== alive) {
					changedCells += 1;
				}
			}
		}

		const previousCells = cells;
		cells = nextCells;
		nextCells = previousCells;
		nextCells.fill(0);

		const totalCells = columns * rows;
		const populationTooLow = nextPopulation < totalCells * minimumPopulationRatio;
		const patternHasStalled = changedCells < totalCells * minimumChangeRatio;

		stalledSteps = populationTooLow || patternHasStalled ? stalledSteps + 1 : 0;

		if (stalledSteps >= 5) {
			for (let seed = 0; seed < 3; seed += 1) {
				const column = Math.floor(columns * (0.5 + Math.random() * 0.42));
				const row = Math.floor(Math.random() * Math.max(rows - 3, 1));
				addGlider(column, row, 0.9);
			}

			stalledSteps = 0;
		}
	};

	const getReadability = (column) => {
		if (canvasWidth < 760) {
			return 0.24;
		}

		const horizontalPosition = column / Math.max(columns - 1, 1);
		const transition = clamp((horizontalPosition - 0.36) / 0.48, 0, 1);
		return 0.12 + transition * 0.88;
	};

	function renderGrid() {
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		context.save();
		context.globalCompositeOperation = 'lighter';

		for (let row = 0; row < rows; row += 1) {
			for (let column = 0; column < columns; column += 1) {
				const index = getIndex(column, row);
				const cellCharge = charge[index];

				if (cellCharge < 0.82) {
					continue;
				}

				const readability = getReadability(column);
				const x = column * tileWidth;
				const y = row * tileHeight;
				const glow = 2 + cellCharge * 4;

				context.fillStyle = `rgba(83, 199, 255, ${0.07 * readability})`;
				context.fillRect(x - glow, y - glow, tileWidth + glow * 2, tileHeight + glow * 2);
			}
		}

		context.restore();

		for (let row = 0; row < rows; row += 1) {
			for (let column = 0; column < columns; column += 1) {
				const index = getIndex(column, row);
				const cellCharge = charge[index];

				if (cellCharge < 0.04) {
					continue;
				}

				const readability = getReadability(column);
				const alive = cells[index] === 1;
				const red = Math.round(143 - 60 * cellCharge);
				const green = Math.round(92 + 107 * cellCharge);
				const alpha = (alive ? 0.16 + cellCharge * 0.42 : cellCharge * 0.12) * readability;
				const gap = 1.5;
				const x = column * tileWidth + gap;
				const y = row * tileHeight + gap;

				context.fillStyle = `rgba(${red}, ${green}, 255, ${alpha})`;
				context.fillRect(x, y, Math.max(0, tileWidth - gap * 2), Math.max(0, tileHeight - gap * 2));
			}
		}
	}

	const getPointerCell = (x, y) => ({
		column: clamp(Math.floor(x / tileWidth), 0, columns - 1),
		row: clamp(Math.floor(y / tileHeight), 0, rows - 1)
	});

	const killPointerCells = () => {
		const pointerCell = getPointerCell(pointerX, pointerY);
		const radius = 2;

		for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
			for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
				if ((offsetX * offsetX) + (offsetY * offsetY) > radius * radius) {
					continue;
				}

				const column = pointerCell.column + offsetX;
				const row = pointerCell.row + offsetY;

				if (column < 0 || column >= columns || row < 0 || row >= rows) {
					continue;
				}

				const index = getIndex(column, row);
				cells[index] = 0;
				charge[index] = 0;
			}
		}
	};

	hero.addEventListener('pointermove', (event) => {
		if (event.pointerType === 'touch') {
			return;
		}

		const bounds = hero.getBoundingClientRect();

		const pointerCell = getPointerCell(event.clientX - bounds.left, event.clientY - bounds.top);
		addSeed(pointerCell.column, pointerCell.row, 1, 1);
		addBlinker(pointerCell.column, pointerCell.row, 1);
		renderGrid();
	});

	hero.addEventListener('click', (event) => {
		if (event.detail === 0) {
			return;
		}

		const bounds = hero.getBoundingClientRect();

		const pointerCell = getPointerCell(event.clientX - bounds.left, event.clientY - bounds.top);
		addSeed(pointerCell.column, pointerCell.row, 5, 1);
		addBlinker(pointerCell.column, pointerCell.row, 1);
		renderGrid();
		
	});

	const heroObserver = new IntersectionObserver((entries) => {
		heroVisible = entries.some((entry) => entry.isIntersecting);
	}, {
		threshold: 0
	});

	const animate = (time) => {
		if (heroVisible && !document.hidden) {
			if (time - lastSimulation >= simulationInterval) {
				updateGrid();
				lastSimulation = time;
			}

			if (time - lastReseed >= 8000) {
				const column = Math.floor(columns * (0.55 + Math.random() * 0.38));
				const row = Math.floor(Math.random() * Math.max(rows - 3, 1));
				addGlider(column, row, 0.9);
				lastReseed = time;
			}

			if (time - lastRender >= renderInterval) {
				renderGrid();
				lastRender = time;
			}
		}

		window.requestAnimationFrame(animate);
	};

	const heroResizeObserver = new ResizeObserver(resizeHeroCanvas);
	heroResizeObserver.observe(hero);
	heroObserver.observe(hero);
	resizeHeroCanvas();
	window.requestAnimationFrame(animate);
}


// art gallery page

const artGalleryItems = Array.from(document.querySelectorAll(".archive-gallery-item"));
const artLightbox = document.querySelector("#art-lightbox");
const artLightboxImage = artLightbox?.querySelector(".art-lightbox-image");
const artLightboxTitle = artLightbox?.querySelector(".art-lightbox-title");
const artLightboxClose = artLightbox?.querySelector(".art-lightbox-close");
const artLightboxPrevious = artLightbox?.querySelector(".art-lightbox-previous");
const artLightboxNext = artLightbox?.querySelector(".art-lightbox-next");

let currentArtIndex = 0;

const showArtImage = (index) => {
	if (!artLightbox || !artLightboxImage || artGalleryItems.length === 0) {
		return;
	}

	currentArtIndex = (index + artGalleryItems.length) % artGalleryItems.length;

	const item = artGalleryItems[currentArtIndex];
	const thumbnail = item.querySelector("img");

	artLightboxImage.src = item.dataset.full || thumbnail.src;
	artLightboxImage.alt = thumbnail.alt;

	if (artLightboxTitle) {
		artLightboxTitle.textContent = item.dataset.title || "";
	}
};

artGalleryItems.forEach((item, index) => {
	item.addEventListener("click", () => {
		showArtImage(index);
		artLightbox.showModal();
	});
});

artLightboxClose?.addEventListener("click", () => {
	artLightbox.close();
});

artLightboxPrevious?.addEventListener("click", () => {
	showArtImage(currentArtIndex - 1);
});

artLightboxNext?.addEventListener("click", () => {
	showArtImage(currentArtIndex + 1);
});

artLightbox?.addEventListener("click", (event) => {
	if (event.target === artLightbox) {
		artLightbox.close();
	}
});

artLightbox?.addEventListener("keydown", (event) => {
	if (event.key === "ArrowLeft") {
		showArtImage(currentArtIndex - 1);
	}

	if (event.key === "ArrowRight") {
		showArtImage(currentArtIndex + 1);
	}
});