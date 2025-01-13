const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Multer setup for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    }),
});

// SQLite database setup
const db = new sqlite3.Database('photos.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        db.run(
            `CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL
            )`,
            (err) => {
                if (err) console.error('Error creating table:', err);
            }
        );
    }
});

// Upload photo endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const photoUrl = `http://localhost:${PORT}/${req.file.filename}`;
    db.run('INSERT INTO photos (url) VALUES (?)', [photoUrl], function (err) {
        if (err) {
            console.error('Error inserting photo:', err);
            return res.status(500).send('Error saving photo.');
        }
        io.emit('update'); // Notify clients about the update
        res.json({ url: photoUrl });
    });
});

// Get all photos endpoint
app.get('/photos', (req, res) => {
    db.all('SELECT url FROM photos', [], (err, rows) => {
        if (err) {
            console.error('Error retrieving photos:', err);
            return res.status(500).send('Error retrieving photos.');
        }
        res.json(rows.map((row) => row.url));
    });
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
