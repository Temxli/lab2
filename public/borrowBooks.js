const messageDiv = document.getElementById('message');
const bookList = document.getElementById('bookList');

async function loadBooks() {
    try {
        const response = await axios.get('/api/books');
        const books = response.data;
        bookList.innerHTML = '';
        books.forEach(book => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            li.innerHTML = `
                <span>${book.title} by ${book.author}</span>
                ${book.available ?
                    `<button class="btn btn-primary borrow-btn" data-book-id="${book.id}">Borrow</button>` :
                    `<button class="btn btn-danger return-btn" data-book-id="${book.id}">Return</button>`}
            `;
            bookList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        bookList.innerHTML = '<li class="list-group-item">Error fetching books. Please try again later.</li>';
    }
}

// Initial load of books
loadBooks();

bookList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('borrow-btn')) {
        const bookId = e.target.getAttribute('data-book-id');
        try {
            const response = await axios.post('/api/borrow', { bookId, userId: '1' }); // Assuming user ID is fixed for demo
            messageDiv.innerHTML = `<div class="alert alert-success">${response.data.message}</div>`;
            loadBooks(); // Reload the book list after borrowing
        } catch (error) {
            if (error.response) {
                messageDiv.innerHTML = `<div class="alert alert-danger">${error.response.data.error}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again later.</div>`;
            }
        }
    } else if (e.target.classList.contains('return-btn')) {
        const bookId = e.target.getAttribute('data-book-id');
        try {
            const response = await axios.post('/api/return', { bookId });
            messageDiv.innerHTML = `<div class="alert alert-success">${response.data.message}</div>`;
            loadBooks(); // Reload the book list after returning
        } catch (error) {
            if (error.response) {
                messageDiv.innerHTML = `<div class="alert alert-danger">${error.response.data.error}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again later.</div>`;
            }
        }
    }
});
