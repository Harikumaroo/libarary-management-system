-- Create Database
CREATE DATABASE library_management;
USE library_management;

-- Users Table (Admin, Librarian, Student)
CREATE TABLE users (
    user_id INT PRIMARY KEY,  -- ID will be given manually
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','librarian','student') NOT NULL,
    register_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books Table
CREATE TABLE books (
    book_id INT PRIMARY KEY,  -- ID will be given manually
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100),
    publisher VARCHAR(100),
    year YEAR,
    copies INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table (Issue/Return)
CREATE TABLE transactions (
    trans_id INT AUTO_INCREMENT PRIMARY KEY, -- still auto since each transaction is unique
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE,
    status ENUM('issued','returned') DEFAULT 'issued',
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
ALTER TABLE transactions AUTO_INCREMENT = 100;

use library_management;
select*from transactions;