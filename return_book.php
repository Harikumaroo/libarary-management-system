<?php
$conn = new mysqli("localhost", "root", "hari@2006", "library_management");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
session_start();

// ✅ Allow librarian only
if (!isset($_SESSION['role']) || $_SESSION['role'] != 'librarian') {
    header("Location:login.php");
    exit();
}

$message = "";

// ✅ Return Book
if (isset($_POST['return'])) {
    $trans_id = $_POST['trans_id'];
    $return_date = date("Y-m-d");

    // Fetch transaction details
    $res = mysqli_query($conn, "SELECT return_date, book_id FROM transactions WHERE trans_id='$trans_id'");
    $row = mysqli_fetch_assoc($res);

    if ($row) {
        $fine = 0;

        // Fine calculation based on due date
        if (strtotime($return_date) > strtotime($row['return_date'])) {
            $days_late = (strtotime($return_date) - strtotime($row['return_date'])) / (60*60*24);
            $fine = $days_late * 10; // ₹10 per day late
        }

        // Update transaction
        mysqli_query($conn, "UPDATE transactions 
                             SET return_date='$return_date', fine='$fine', status='returned' 
                             WHERE trans_id='$trans_id'");

        // Update book copies
        mysqli_query($conn, "UPDATE books SET copies=copies+1, availability='available' WHERE book_id='".$row['book_id']."'");

        $message = "✅ Book Returned! Fine: ₹".$fine;
    } else {
        $message = "❌ Invalid Transaction ID!";
    }
}

// ✅ Fetch all transactions for report
$sql = "SELECT t.trans_id, b.title, t.user_id, s.name, t.issue_date, t.return_date, t.fine, t.status, t.handled_by
        FROM transactions t
        JOIN books b ON t.book_id = b.book_id
        JOIN students s ON t.user_id = s.register_no
        ORDER BY t.issue_date DESC";
$result = mysqli_query($conn, $sql);
?>
<!DOCTYPE html>
<html>
<head>
    <title>book return</title>
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</head>
<body class="container mt-4">
    <h2>Book Return</h2>
    <a href="librarian_dashboard.php" class="btn btn-secondary mb-3">← Back to Dashboard</a>

    <?php if($message != ""): ?>
        <div class="alert alert-info"><?php echo $message; ?></div>
    <?php endif; ?>

    <!-- Return Book Form -->
    <form method="POST" class="card p-3 shadow-sm mb-4">
        <h5>🔄 Return Book</h5>
        <div class="mb-3">
            <label class="form-label">Transaction ID</label>
            <input type="text" name="trans_id" class="form-control" required>
        </div>
        <button type="submit" name="return" class="btn btn-success">Return Book</button>
    </form>

    <!-- All Transactions -->
    <h4>📚 All Transactions</h4>
    <table class="table table-bordered table-striped">
        <thead class="table-dark">
            <tr>
                <th>ID</th>
                <th>Book</th>
                <th>Register No</th>
                <th>Student Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Handled By</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = mysqli_fetch_assoc($result)) { ?>
                <tr>
                    <td><?php echo $row['trans_id']; ?></td>
                    <td><?php echo $row['title']; ?></td>
                    <td><?php echo $row['user_id']; ?></td>
                    <td><?php echo $row['name']; ?></td>
                    <td><?php echo $row['issue_date']; ?></td>
                    <td><?php echo $row['return_date']; ?></td>
                    <td><?php echo $row['return_date']; ?></td>
                    <td><?php echo $row['status']; ?></td>
                    <td><?php echo $row['fine']; ?></td>
                    <td><?php echo $row['handled_by']; ?></td>
                </tr>
            <?php } ?>
        </tbody>
    </table>
</body>
</html>