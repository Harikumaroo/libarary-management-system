<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Library Login</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #4e73df, #1cc88a);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0px 4px 15px rgba(0,0,0,0.2);
            padding: 30px;
            width: 350px;
        }
        .login-card h2 {
            text-align: center;
            margin-bottom: 20px;
            color: #4e73df;
        }
        .btn-custom {
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <h2>📚 Library Login</h2>

        <!-- Admin/Librarian Login -->
        <form method="POST" action="login_process.php">
            <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" name="username" class="form-control" placeholder="Enter your username" required>
            </div>

            <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-control" placeholder="Enter your password" required>
            </div>

            <button type="submit" class="btn btn-primary btn-custom mb-3">Login</button>
        </form>

        <!-- Student Login Button -->
        <a href="student_login.php" class="btn btn-success btn-custom">Login as Student</a>
    </div>
</body>
</html>