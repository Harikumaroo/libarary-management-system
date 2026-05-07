<?php
session_start();

// Protect page: only admin can access
if (!isset($_SESSION['role']) || $_SESSION['role'] != 'admin') {
    header("Location: login_process.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard - Library Management System</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
    <style>
        body {
            background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('img/libimg2.jpeg');
            background-size: cover;
            color: white;
        }
        .dashboard-card {
            transition: transform 0.2s ease-in-out;
        }
        .dashboard-card:hover {
            transform: translateY(-5px);
        }
        #card1,#card2, #card3 {
            padding: 30px;
            margin: 20px;
        }
        #stu{
            padding-top: 10px;
            width: 350px;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">📚 Library Admin</a>
            <div class="d-flex">
                <span class="navbar-text text-white me-3">
                    Welcome, <?php echo $_SESSION['username']; ?> (Admin)
                </span>
                <a href="logout.php" class="btn btn-outline-light">Logout</a>
            </div>
        </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="container mt-4">
        <h2 class="mb-4">Admin Dashboard</h2>
        <div class="row g-4">
            <!-- Manage Users -->
            <div class="col-md-4">
                <div class="card dashboard-card shadow-sm">
                    <div class="card-body text-center" id="card1">
                        <h5 class="card-title">👥 Manage Users</h5>
                        <a href="manage_users.php" class="btn btn-primary">Go</a>
                    </div>
                </div>
            </div>
            <!-- Manage Books -->
            <div class="col-md-4">
                <div class="card dashboard-card shadow-sm">
                    <div class="card-body text-center" id="card2">
                        <h5 class="card-title">📖 Manage Books</h5>
                        <a href="manage_books.php" class="btn btn-success">Go</a>
                    </div>
                </div>
            </div>
            <!-- Reports -->
            <div class="col-md-4">
                <div class="card dashboard-card shadow-sm">
                    <div class="card-body text-center" id="card3">
                        <h5 class="card-title">📊 Reports</h5>
                        <a href="reports.php" class="btn btn-info">Go</a>
                    </div>
                </div>
            </div>
        </div>
        <!-- student list -->
         <div class="col-md-4 id=" id="stu">
                <div class="card dashboard-card shadow-sm">
                    <div class="card-body text-center" id="card4">
                        <h5 class="card-title">student list</h5>
                        <a href="student_list.php" class="btn btn-success">Go</a>
                    </div>
                </div>
            </div>
        <!-- Quick Actions -->
        <div class="mt-5">
            <h3>Quick Actions</h3>
            <p>Use the cards above to manage users, books, and view reports quickly.</p>
        </div>
    </div>
</body>
</html>