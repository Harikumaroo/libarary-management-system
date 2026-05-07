<?php $host = "localhost";
      $user = "root";
      $password = "hari@2006";
      $dbname = "library_management";
      $conn = new mysqli($host, $user, $password, $dbname);
    if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}?>