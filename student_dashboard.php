<?php
$conn = new mysqli("localhost", "root", "hari@2006", "library_management");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
session_start();

// Protect page: only student can access
if (!isset($_SESSION['role']) || $_SESSION['role'] != 'student') {
    header("Location: login.php");
    exit();
}

// Use register_number from session
$register_number = $_SESSION['register_number'];

// Handle Book Search
$search_results = [];
if (isset($_POST['search'])) {
    $keyword = $_POST['keyword'];
    $sql = "SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ?";
    $stmt = $conn->prepare($sql);
    $like = "%$keyword%";
    $stmt->bind_param("sss", $like, $like, $like);
    $stmt->execute();
    $search_results = $stmt->get_result();
}

// Fetch Borrowed Books (Issued)
$sql = "SELECT b.title, b.author, t.issue_date, t.return_date
        FROM transactions t
        JOIN books b ON t.book_id = b.book_id
        JOIN students s ON t.user_id = s.register_no
        WHERE s.register_no = ? AND t.status = 'Issued'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $register_number);
$stmt->execute();
$borrowed_books = $stmt->get_result();

// Fetch Returned Books
$sql = "SELECT b.title, b.author, t.issue_date, t.return_date 
        FROM transactions t 
        JOIN books b ON t.book_id = b.book_id 
        JOIN students s ON t.user_id = s.register_no
        WHERE s.register_no = ? AND t.status = 'Returned'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $register_number);
$stmt->execute();
$returned_books = $stmt->get_result();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Student Dashboard</title>
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</head>
<body class="container mt-4">
    <h1>Welcome, <?php echo $_SESSION['username']; ?> (Student)</h1>
    <a href="logout.php" class="btn btn-danger mb-3">Logout</a>

    <!-- Book Search -->
    <h2>🔍 Search Books</h2>
    <form method="POST" class="card p-3 shadow-sm mb-4">
        <input type="text" name="keyword" class="form-control mb-2" placeholder="Enter title, author, or category" required>
        <button type="submit" name="search" class="btn btn-primary">Search</button>
    </form>

    <?php if (!empty($search_results)) { ?>
    <h3>Search Results</h3>
    <table class="table table-striped table-bordered">
        <thead class="table-dark">
            <tr>
                <th>Title</th><th>Author</th><th>Category</th><th>Availability</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = $search_results->fetch_assoc()) { ?>
            <tr>
                <td><?php echo $row['title']; ?></td>
                <td><?php echo $row['author']; ?></td>
                <td><?php echo $row['category']; ?></td>
                <td><?php echo $row['availability']; ?></td>
            </tr>
            <?php } ?>
        </tbody>
    </table>
    <?php } ?>

    <!-- Borrowed Books -->
    <h2>📚 Currently Borrowed Books</h2>
    <table class="table table-striped table-bordered">
        <thead class="table-success">
            <tr>
                <th>Title</th><th>Author</th><th>Issue Date</th><th>Due Date</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = $borrowed_books->fetch_assoc()) { ?>
            <tr>
                <td><?php echo $row['title']; ?></td>
                <td><?php echo $row['author']; ?></td>
                <td><?php echo $row['issue_date']; ?></td>
                <td><?php echo $row['return_date']; ?></td>
            </tr>
            <?php } ?>
        </tbody>
    </table>

    <!-- Returned Books -->
    <h2>✅ Returned Books History</h2>
    <table class="table table-striped table-bordered">
        <thead class="table-info">
            <tr>
                <th>Title</th><th>Author</th><th>Issue Date</th><th>Returned On</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = $returned_books->fetch_assoc()) { ?>
            <tr>
                <td><?php echo $row['title']; ?></td>
                <td><?php echo $row['author']; ?></td>
                <td><?php echo $row['issue_date']; ?></td>
                <td><?php echo $row['return_date']; ?></td>
            </tr>
            <?php } ?>
        </tbody>
    </table>
</body>
</html>