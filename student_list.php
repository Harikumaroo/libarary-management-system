<?php
include 'db_connect.php';
session_start();

// ✅ Allow only librarian and admin
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['librarian','admin'])) {
    header("Location: login.php");
    exit();
}

// ✅ Set dashboard link based on role
$dashboard_link = ($_SESSION['role'] == 'admin') ? "admin_dashboard.php" : "librarian_dashboard.php";

$message = "";

// ✅ Add Student
if (isset($_POST['add'])) {
    $register_no = $_POST['register_no'];
    $name        = $_POST['name'];
    $department  = $_POST['department'];
    $year        = (int)$_POST['year']; // numeric only
    $contact_no  = $_POST['contact_no'];
    $email_id    = $_POST['email_id'];

    $sql = "INSERT INTO students (register_no, name, department, year, contact_no, email_id)
            VALUES ('$register_no', '$name', '$department', '$year', '$contact_no', '$email_id')";
    if (mysqli_query($conn, $sql)) {
        header("Location: student_list.php"); // reload to show new student
        exit();
    } else {
        $message = "Error: " . mysqli_error($conn);
    }
}

// ✅ Delete Student
if (isset($_GET['delete'])) {
    $register_no = $_GET['delete'];
    $sql = "DELETE FROM students WHERE register_no='$register_no'";
    if (mysqli_query($conn, $sql)) {
        $message = "Student deleted successfully!";
    } else {
        $message = "Error deleting student: " . mysqli_error($conn);
    }
}

// ✅ Edit Student (Update)
if (isset($_POST['update'])) {
    $register_no = $_POST['register_no'];
    $name        = $_POST['name'];
    $department  = $_POST['department'];
    $year        = (int)$_POST['year']; // force numeric
    $contact_no  = $_POST['contact_no'];
    $email_id    = $_POST['email_id'];

    $sql = "UPDATE students 
            SET name='$name', department='$department', year='$year', contact_no='$contact_no', email_id='$email_id' 
            WHERE register_no='$register_no'";
    if (mysqli_query($conn, $sql)) {
        $message = "Student updated successfully!";
    } else {
        $message = "Error updating student: " . mysqli_error($conn);
    }
}

// ✅ Fetch Students
$sql = "SELECT * FROM students";
$result = mysqli_query($conn, $sql);

// ✅ If Edit clicked, fetch student details
$edit_row = null;
if (isset($_GET['edit'])) {
    $register_no = $_GET['edit'];
    $sql = "SELECT * FROM students WHERE register_no='$register_no'";
    $edit_result = mysqli_query($conn, $sql);
    $edit_row = mysqli_fetch_assoc($edit_result);
}

// ✅ Year mapping for display
$year_map = [1 => "1st Year", 2 => "2nd Year", 3 => "3rd Year", 4 => "Final Year"];
?>
<!DOCTYPE html>
<html>
<head>
    <title>Student List</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body>
<div class="container mt-4">
    <h2 class="mb-3">📋 Student List</h2>
    <a href="<?php echo $dashboard_link; ?>" class="btn btn-secondary mb-3">Back to Dashboard</a>

    <?php if (!empty($message)) { ?>
        <div class="alert alert-info"><?php echo $message; ?></div>
    <?php } ?>

    <!-- Add Student Form -->
    <form method="POST" class="mb-4">
        <div class="row">
            <div class="col-md-2"><input type="text" name="register_no" class="form-control" placeholder="Register No" required></div>
            <div class="col-md-2"><input type="text" name="name" class="form-control" placeholder="Name" required></div>
            <div class="col-md-2"><input type="text" name="department" class="form-control" placeholder="Department" required></div>
            <div class="col-md-1">
                <select name="year" class="form-control" required>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">Final Year</option>
                </select>
            </div>
            <div class="col-md-2"><input type="text" name="contact_no" class="form-control" placeholder="Contact No"></div>
            <div class="col-md-3"><input type="email" name="email_id" class="form-control" placeholder="Email ID"></div>
        </div>
        <button type="submit" name="add" class="btn btn-primary mt-2">Add Student</button>
    </form>

    <!-- Edit Student Form (only shows when Edit clicked) -->
    <?php if ($edit_row) { ?>
    <div class="card mb-4">
        <div class="card-header">Edit Student</div>
        <div class="card-body">
            <form method="POST">
                <input type="hidden" name="register_no" value="<?php echo $edit_row['register_no']; ?>">
                <input type="text" name="name" value="<?php echo $edit_row['name']; ?>" class="form-control mb-2" required>
                <input type="text" name="department" value="<?php echo $edit_row['department']; ?>" class="form-control mb-2" required>
                <select name="year" class="form-control mb-2" required>
                    <option value="1" <?php if($edit_row['year']==1) echo "selected"; ?>>1st Year</option>
                    <option value="2" <?php if($edit_row['year']==2) echo "selected"; ?>>2nd Year</option>
                    <option value="3" <?php if($edit_row['year']==3) echo "selected"; ?>>3rd Year</option>
                    <option value="4" <?php if($edit_row['year']==4) echo "selected"; ?>>Final Year</option>
                </select>
                <input type="text" name="contact_no" value="<?php echo $edit_row['contact_no']; ?>" class="form-control mb-2">
                <input type="email" name="email_id" value="<?php echo $edit_row['email_id']; ?>" class="form-control mb-2">
                <button type="submit" name="update" class="btn btn-success">Update</button>
                <a href="student_list.php" class="btn btn-secondary">Cancel</a>
            </form>
        </div>
    </div>
    <?php } ?>

    <!-- Student Table -->
    <table class="table table-bordered table-striped">
        <thead class="table-dark">
            <tr>
                <th>Register No</th>
                <th>Name</th>
                <th>Department</th>
                <th>Year</th>
                <th>Contact No</th>
                <th>Email ID</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = mysqli_fetch_assoc($result)) { ?>
                <tr>
                    <td><?php echo $row['register_no']; ?></td>
                    <td><?php echo $row['name']; ?></td>
                    <td><?php echo $row['department']; ?></td>
                    <td><?php echo $year_map[$row['year']] ?? $row['year']; ?></td>
                    <td><?php echo $row['contact_no']; ?></td>
                    <td><?php echo $row['email_id']; ?></td>
                    <td>
                        <a href="?edit=<?php echo $row['register_no']; ?>" class="btn btn-sm btn-warning">Edit</a>
                        <a href="?delete=<?php echo $row['register_no']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</a>
                    </td>
                </tr>
            <?php } ?>
        </tbody>
    </table>
</div>
</body>
</html>