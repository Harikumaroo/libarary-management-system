<?php
session_start();
include("db_connect.php"); // database connection file

$username = $_POST['username'];
$password = $_POST['password'];

// Secure query
$sql = "SELECT * FROM users WHERE username=? AND password=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 1) {
    $row = $result->fetch_assoc();
    $role = $row['role'];

    // Store session variables
    $_SESSION['user_id'] = $row['user_id'];   // ✅ use correct column name from users table
    $_SESSION['username'] = $row['username'];
    $_SESSION['role'] = $row['role'];
    $_SESSION['register_number'] = $row['register_number'];

    // Redirect based on role
    if ($role == 'admin') {
        header("Location: admin_dashboard.php");
    } elseif ($role == 'librarian') {
        header("Location: librarian_dashboard.php");
    } elseif ($role == 'student') {
        header("Location: student_dashboard.php?register_number=" . $row['register_number']);
    }
    exit();
} else {
    echo "Invalid username or password!";
}
?>