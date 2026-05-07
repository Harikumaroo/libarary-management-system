<?php
session_start(); // Start session at the very top

$conn = new mysqli("localhost", "root", "hari@2006", "library_management");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Protect page: only admin can access
if (!isset($_SESSION['role']) || $_SESSION['role'] != 'admin') {
    header("Location: login.php");
    exit();
}

// Handle Add Book
if (isset($_POST['add_book'])) {
    if (!empty($_POST['book_id'])) {
        $book_id   = $_POST['book_id'];   // manual entry
        $title     = $_POST['title'];
        $author    = $_POST['author'];
        $publisher = $_POST['publisher'];
        $category  = $_POST['category'];
        $availability = $_POST['availability'];
        $year      = $_POST['year'];

        $sql = "INSERT INTO books (book_id, title, author, publisher, category, availability, year) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("issssss", $book_id, $title, $author, $publisher, $category, $availability, $year);
        $stmt->execute();
    } else {
        echo "<p class='text-danger'>Book ID is required!</p>";
    }
}

// Handle Delete Book
if (isset($_GET['delete'])) {
    $id = $_GET['delete'];
    $sql = "DELETE FROM books WHERE book_id=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $id);
    $stmt->execute();
}

// Fetch Books
$result = $conn->query("SELECT * FROM books");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Books</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
    <style>
        body {
            background-image: radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%),
  url('img/libimg3.jpeg');
            background-size: cover;
        }
    </style>
</head>
<body class="bg-light">
    <div class="container mt-4">
        <h1 class="mb-4">📖 Manage Books</h1>
        <a href="admin_dashboard.php" class="btn btn-secondary mb-3">← Back to Dashboard</a>

        <!-- Add Book Form -->
        <div class="card mb-4 shadow-sm">
            <div class="card-header bg-primary text-white">Add New Book</div>
            <div class="card-body">
                <form method="POST" class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Book ID</label>
                        <input type="text" name="book_id" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Title</label>
                        <input type="text" name="title" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Author</label>
                        <input type="text" name="author" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Publisher</label>
                        <input type="text" name="publisher" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Category</label>
                        <input type="text" name="category" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Year</label>
                        <input type="text" name="year" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Availability</label>
                        <select name="availability" class="form-select" required>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <button type="submit" name="add_book" class="btn btn-success">Add Book</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Existing Books Table -->
        <div class="card shadow-sm">
            <div class="card-header bg-dark text-white">Existing Books</div>
            <div class="card-body">
                <table class="table table-striped table-bordered">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th><th>Title</th><th>Author</th><th>Publisher</th>
                            <th>Category</th><th>Year</th><th>Availability</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = $result->fetch_assoc()) { ?>
                        <tr>
                            <td><?php echo $row['book_id']; ?></td>
                            <td><?php echo $row['title']; ?></td>
                            <td><?php echo $row['author']; ?></td>
                            <td><?php echo $row['publisher']; ?></td>
                            <td><?php echo $row['category']; ?></td>
                            <td><?php echo $row['year']; ?></td>
                            <td><?php echo ucfirst($row['availability']); ?></td>
                            <td>
                                <a href="manage_books.php?delete=<?php echo $row['book_id']; ?>" 
                                   class="btn btn-danger btn-sm"
                                   onclick="return confirm('Are you sure you want to delete this book?');">
                                   Delete
                                </a>
                            </td>
                        </tr>
                        <?php } ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>