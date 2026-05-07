<?php
$conn = new mysqli("localhost", "root", "hari@2006", "library_management");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
session_start();

// ✅ Allow librarian or admin
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['librarian','admin'])) {
    header("Location: ../login.php");
    exit();
}

$message = "";
$student_details = null;

// ✅ Step 1: Load student details by register number
if (isset($_POST['find_student'])) {
    $register_no = $_POST['register_no'];
    $sql = "SELECT * FROM students WHERE register_no = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $register_no);
    $stmt->execute();
    $result = $stmt->get_result();
    $student_details = $result->fetch_assoc();

    if (!$student_details) {
        $message = "❌ No student found with Register No: $register_no";
    }
}

// ✅ Step 2: Issue Book
if (isset($_POST['issue'])) {
    $register_no = $_POST['register_no'];   // student identifier
    $book_id     = $_POST['book_id'];

    $issue_date = date("Y-m-d");
    $due_date   = date("Y-m-d", strtotime("+7 days"));
    $librarian_id = $_SESSION['user_id'];

    // Check availability using copies + availability
    $check = mysqli_query($conn, "SELECT copies, title, availability FROM books WHERE book_id='$book_id'");
    $row = mysqli_fetch_assoc($check);

    if ($row && $row['copies'] > 0 && $row['availability'] == 'available') {
        // Insert transaction into transactions table
        $sql = "INSERT INTO transactions (book_id, user_id, issue_date, return_date, handled_by) 
                VALUES ('$book_id','$register_no','$issue_date','$due_date','$librarian_id')";
        mysqli_query($conn, $sql);

        // Update book copies
        mysqli_query($conn, "UPDATE books SET copies=copies-1 WHERE book_id='$book_id'");

        // If no copies left, mark unavailable
        mysqli_query($conn, "UPDATE books SET availability='unavailable' WHERE book_id='$book_id' AND copies=0");

        $message = "✅ Book '{$row['title']}' issued successfully to Register No: $register_no";
    } else {
        $message = "❌ Book not available!";
    }
}

// ✅ Fetch all books for right-side display
$books = mysqli_query($conn, "SELECT book_id, title, author, category, publisher, year, copies, availability FROM books");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Issue Book</title>
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</head>
<body class="container mt-4">
    <h2>📚 Issue Book</h2>
    <a href="<?php 
        echo ($_SESSION['role']=='admin') 
            ? 'admin_dashboard.php' 
            : (($_SESSION['role']=='librarian') 
                ? 'librarian_dashboard.php' 
                : 'dashboard.php'); 
    ?>" class="btn btn-secondary mb-3">← Back to Dashboard</a>

    <?php if($message != ""): ?>
        <div class="alert alert-info"><?php echo $message; ?></div>
    <?php endif; ?>

    <div class="row">
        <!-- Left side: Student & Issue Form -->
        <div class="col-md-6">
            <!-- Step 1: Find Student -->
            <form method="POST" class="card p-3 shadow-sm mb-3">
                <h5>🔍 Find Student</h5>
                <input type="text" name="register_no" class="form-control mb-2" placeholder="Enter Register Number" required>
                <button type="submit" name="find_student" class="btn btn-primary">Find Student</button>
            </form>

            <?php if ($student_details) { ?>
                <div class="card p-3 mb-3">
                    <h5>👤 Student Details</h5>
                    <p><strong>Name:</strong> <?php echo $student_details['name']; ?></p>
                    <p><strong>Department:</strong> <?php echo $student_details['department']; ?></p>
                    <p><strong>Year:</strong> <?php echo $student_details['year']; ?></p>
                    <p><strong>Email:</strong> <?php echo $student_details['email_id']; ?></p>
                </div>

                <!-- Step 2: Issue Book -->
                <form method="POST" class="card p-3 shadow-sm">
                    <input type="hidden" name="register_no" value="<?php echo $student_details['register_no']; ?>">
                    <div class="mb-3">
                        <label class="form-label">Book ID</label>
                        <input type="text" name="book_id" class="form-control" required>
                    </div>
                    <button type="submit" name="issue" class="btn btn-success">Issue Book</button>
                </form>
            <?php } ?>
        </div>

        <!-- Right side: Available Books -->
        <div class="col-md-6">
            <h5>📖 Available Books</h5>
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Book ID</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Publisher</th>
                        <th>Year</th>
                        <th>Copies</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = mysqli_fetch_assoc($books)) { ?>
                        <tr>
                            <td><?php echo $row['book_id']; ?></td>
                            <td><?php echo $row['title']; ?></td>
                            <td><?php echo $row['author']; ?></td>
                            <td><?php echo $row['category']; ?></td>
                            <td><?php echo $row['publisher']; ?></td>
                            <td><?php echo $row['year']; ?></td>
                            <td><?php echo $row['copies']; ?></td>
                            <td><?php echo $row['availability']; ?></td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>