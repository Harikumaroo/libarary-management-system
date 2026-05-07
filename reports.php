<?php
// reports.php
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

// Helper function: return dashboard link based on role
function getDashboardLink($role){
    switch($role){
        case 'admin': return 'admin_dashboard.php';
        case 'librarian': return 'librarian_dashboard.php';
        case 'student': return 'student_dashboard.php';
        default: return 'login.php';
    }
}

// ✅ Fetch issued books (status = 'issued')
$issued_query = "SELECT t.trans_id, b.title AS book_name, s.register_no, s.name AS student_name,
                        t.issue_date, t.return_date, t.handled_by
                 FROM transactions t
                 JOIN books b ON t.book_id = b.book_id
                 JOIN students s ON t.user_id = s.register_no
                 WHERE t.status='issued'
                 ORDER BY t.issue_date DESC";
$issued_result = mysqli_query($conn, $issued_query);

// ✅ Fetch returned books (status = 'returned')
$returned_query = "SELECT t.trans_id, b.title AS book_name, s.register_no, s.name AS student_name,
                          t.issue_date, t.return_date, t.fine, t.handled_by
                   FROM transactions t
                   JOIN books b ON t.book_id = b.book_id
                   JOIN students s ON t.user_id = s.register_no
                   WHERE t.status='returned'
                   ORDER BY t.return_date DESC";
$returned_result = mysqli_query($conn, $returned_query);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Reports</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body class="container mt-4">
    <h2 class="mb-4 text-primary">📊 Library Reports</h2>

    <!-- Back to Dashboard -->
    <div class="mb-3">
        <a href="<?= getDashboardLink($_SESSION['role']); ?>" class="btn btn-outline-primary">
            <i class="bi bi-arrow-left-circle"></i> Back to Dashboard
        </a>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs" id="reportTabs" role="tablist">
        <li class="nav-item">
            <button class="nav-link active" id="issued-tab" data-bs-toggle="tab" data-bs-target="#issued" type="button">Issued Books</button>
        </li>
        <li class="nav-item">
            <button class="nav-link" id="returned-tab" data-bs-toggle="tab" data-bs-target="#returned" type="button">Returned Books</button>
        </li>
    </ul>

    <div class="tab-content mt-3">
        <!-- Issued Books -->
        <div class="tab-pane fade show active" id="issued">
            <div class="card shadow-sm">
                <div class="card-header bg-info text-white">Issued Books</div>
                <div class="card-body table-responsive">
                    <table class="table table-hover table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th><th>Book</th><th>Register No</th><th>Student</th>
                                <th>Issued On</th><th>Due Date</th><th>Handled By</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if(mysqli_num_rows($issued_result) > 0){
                                while($row = mysqli_fetch_assoc($issued_result)){ ?>
                                <tr>
                                    <td><?= $row['trans_id'] ?></td>
                                    <td><span class="badge bg-primary"><?= $row['book_name'] ?></span></td>
                                    <td><?= $row['register_no'] ?></td>
                                    <td><?= $row['student_name'] ?></td>
                                    <td><?= $row['issue_date'] ?></td>
                                    <td><?= $row['return_date'] ?></td>
                                    <td><i class="bi bi-person-badge"></i> <?= $row['handled_by'] ?></td>
                                </tr>
                            <?php } } else { ?>
                                <tr><td colspan="7" class="text-center text-muted">No issued books found</td></tr>
                            <?php } ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Returned Books -->
        <div class="tab-pane fade" id="returned">
            <div class="card shadow-sm">
                <div class="card-header bg-success text-white">Returned Books</div>
                <div class="card-body table-responsive">
                    <table class="table table-hover table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th><th>Book</th><th>Register No</th><th>Student</th>
                                <th>Issued On</th><th>Returned On</th><th>Fine</th><th>Handled By</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if(mysqli_num_rows($returned_result) > 0){
                                while($row = mysqli_fetch_assoc($returned_result)){ ?>
                                <tr>
                                    <td><?= $row['trans_id'] ?></td>
                                    <td><span class="badge bg-secondary"><?= $row['book_name'] ?></span></td>
                                    <td><?= $row['register_no'] ?></td>
                                    <td><?= $row['student_name'] ?></td>
                                    <td><?= $row['issue_date'] ?></td>
                                    <td><?= $row['return_date'] ?></td>
                                    <td><?= $row['fine'] ?></td>
                                    <td><i class="bi bi-person-badge"></i> <?= $row['handled_by'] ?></td>
                                </tr>
                            <?php } } else { ?>
                                <tr><td colspan="8" class="text-center text-muted">No returned books found</td></tr>
                            <?php } ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>