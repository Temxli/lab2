$(document).ready(() => {
    const booksList = $('#booksList');

    function getBooks() {
        fetch('/api/books')
            .then(response => response.json())
            .then(books => {
                booksList.empty();
                books.forEach(book => {
                    const li = $('<li>').addClass('list-group-item').text(`${book.title} by ${book.author}`);
                    const deleteButton = $('<button>').addClass('btn btn-danger btn-sm float-end').text('Delete');
                    li.append(deleteButton);

                    deleteButton.on('click', () => {
                        fetch(`/api/books/${book.id}`, {
                            method: 'DELETE'
                        })
                            .then(response => response.json())
                            .then(data => {
                                alert(data.message);
                                getBooks(); // Reload the list of books after deleting
                            })
                            .catch(error => {
                                console.error('Error deleting book:', error);
                                alert('Error deleting book. Please try again.');
                            });
                    });

                    booksList.append(li);
                });
            });
    }

    getBooks();

    $('#addBookForm').submit(event => {
        event.preventDefault();
        const title = $('#title').val();
        const author = $('#author').val();
        fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author })
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                getBooks();
            })
            .catch(error => {
                console.error('Error adding book:', error);
                alert('Error adding book. Please try again.');
            });
    });
});
