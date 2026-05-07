<?php
session_start();
include("db_connect.php"); // database connection file

// Capture inputs
$register_no = $_POST['register_no'] ?? null;
$name = $_POST['name'] ?? null;

if (!empty($register_no) && !empty($name)) {
    // Student Login (register number + name)
    $sql = "SELECT * FROM students WHERE register_no=? AND name=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $register_no, $name);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();

        // Store student session
        $_SESSION['role'] = 'student';
        $_SESSION['register_number'] = $row['register_no'];
        $_SESSION['username'] = $row['name'];
        $_SESSION['department'] = $row['department'];
        $_SESSION['year'] = $row['year'];
        $_SESSION['email_id'] = $row['email_id'];

        // Redirect to student dashboard
        header("Location: student_dashboard.php");
        exit();
    } else {
        echo "Invalid Register Number or Name!";
    }
} else {
    echo "Please enter Register Number and Name!";
}
?>