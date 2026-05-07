<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student Login</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
</head>
<body class="container mt-5">
    <h2 class="mb-4">Student Login</h2>
    <form action="student_login_process.php" method="POST" class="card p-4 shadow-sm">
        <div class="mb-3">
            <label class="form-label">Register Number</label>
            <input type="text" name="register_no" class="form-control" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Name</label>
            <input type="text" name="name" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-success">Login</button>
    </form>
</body>
</html>