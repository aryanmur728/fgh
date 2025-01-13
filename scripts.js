const API_URL = 'http://localhost:5000';
const socket = io(API_URL); // Connect to the WebSocket server

// Display gallery by fetching photos from the server
function displayGallery(editable) {
    fetch(`${API_URL}/photos`)
        .then((response) => response.json())
        .then((urls) => {
            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';
            urls.forEach((url) => {
                const newItem = document.createElement('div');
                newItem.classList.add('gallery-item');
                newItem.innerHTML = `
                    <img src="${url}" alt="Uploaded Photo" onclick="openFullscreen(this)">
                    ${
                        editable
                            ? `<div class="delete-btn" onclick="deletePhoto('${url}')">Delete</div>`
                            : ''
                    }
                `;
                gallery.appendChild(newItem);
            });
        })
        .catch((err) => console.error('Error fetching photos:', err));
}

// Upload photos to the server
function uploadPhotos() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    Array.from(files).forEach((file) => {
        const formData = new FormData();
        formData.append('photo', file);

        fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .catch((err) => console.error('Error uploading photo:', err));
    });

    fileInput.value = '';
}

// Open fullscreen image
function openFullscreen(img) {
    const overlay = document.getElementById('fullscreenOverlay');
    const fullscreenImg = document.getElementById('fullscreenImage');
    fullscreenImg.src = img.src;
    overlay.style.display = 'flex';
}

// Close fullscreen
function closeFullscreen() {
    document.getElementById('fullscreenOverlay').style.display = 'none';
}

// Listen for real-time updates
socket.on('update', () => {
    displayGallery(true); // Refresh gallery when an update occurs
});
