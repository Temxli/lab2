const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pgp = require('pg-promise')();
const path = require('path');

// Configure the database connection
const connectionString = 'postgres://postgres:123456@localhost:5432/mydatabase';
const db = pgp(connectionString);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use(bodyParser.json());

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await db.one(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, hashedPassword, role]
        );
        res.status(201).json(result);
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Error during registration');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', email);

        if (!user) {
            return res.status(401).send('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send('Invalid email or password');
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
});

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await db.any('SELECT * FROM books');
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single book by ID
app.get('/api/books/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const book = await db.one('SELECT * FROM books WHERE id = $1', id);
        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(404).json({ error: 'Book not found' });
    }
});

// Create a new book
app.post('/api/books', async (req, res) => {
    const { title, author } = req.body;
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }

    try {
        const newBook = await db.one('INSERT INTO books(title, author) VALUES($1, $2) RETURNING *', [title, author]);
        res.status(201).json(newBook);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a book
app.put('/api/books/:id', async (req, res) => {
    const id = req.params.id;
    const { title, author } = req.body;
    try {
        const updatedBook = await db.one('UPDATE books SET title = $1, author = $2 WHERE id = $3 RETURNING *', [title, author, id]);
        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(404).json({ error: 'Book not found' });
    }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.none('DELETE FROM books WHERE id = $1', id);
        res.json({ message: 'Book deleted' }); // Send a JSON response
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(404).json({ error: 'Book not found' });
    }
});


// Borrow a book
app.post('/api/borrow', async (req, res) => {
    const { bookId, userId } = req.body;

    try {
        // Check if the book exists
        const book = await db.oneOrNone('SELECT * FROM books WHERE id = $1', bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Check if the book is available
        if (!book.available) {
            return res.status(400).json({ error: 'Book is already borrowed' });
        }

        // Mark the book as borrowed
        await db.none('UPDATE books SET available = false WHERE id = $1', bookId);

        // Record the borrowing
        await db.none('INSERT INTO borrowed_books(book_id, user_id) VALUES($1, $2)', [bookId, userId]);

        res.status(200).json({ message: 'Book borrowed successfully' });
    } catch (error) {
        console.error('Error borrowing book:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/return', async (req, res) => {
    const { bookId } = req.body;

    try {
        // Check if the book exists
        const book = await db.oneOrNone('SELECT * FROM books WHERE id = $1', bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Check if the book is already returned
        if (book.available) {
            return res.status(400).json({ error: 'Book is already returned' });
        }

        // Mark the book as returned
        await db.none('UPDATE books SET available = true WHERE id = $1', bookId);

        res.status(200).json({ message: 'Book returned successfully' });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));

});


// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
