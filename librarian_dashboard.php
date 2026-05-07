<?php
$conn = new mysqli("localhost", "root", "hari@2006", "library_management");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
session_start();

// Protect page: only librarian can access
if (!isset($_SESSION['role']) || $_SESSION['role'] != 'librarian') {
    header("Location: login.php");
    exit();
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Librarian Dashboard</title>
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
    <style>
       body{
        background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('img/libimg4.jpeg');
        background-size: cover;
        color: antiquewhite;
       }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1>Welcome, <?php echo $_SESSION['username']; ?> (Librarian)</h1>
        <a href="logout.php" class="btn btn-danger mb-3">Logout</a>

        <div class="row">
            <div class="col-md-4">
                <a href="issue_book.php" class="btn btn-primary btn-block w-100">📚 Issue Book</a>
            </div>
            <div class="col-md-4">
                <a href="return_book.php" class="btn btn-success btn-block w-100">🔄 Return Book</a>
            </div>
            <div class="col-md-4">
                <a href="reports.php" class="btn btn-info btn-block w-100">📊 Reports</a>
            </div>
        </div>
        <div class="col">
             <div class="col-md-4" style="padding-top: 10px; width:350px;">
                <a href="student_list.php" class="btn btn-success btn-block w-100">Student list</a>
            </div>
        </div>
    </div>
</body>
</html>