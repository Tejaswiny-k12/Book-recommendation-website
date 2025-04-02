<?php
include "connect.php";

// login users here
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Get form data
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = mysqli_real_escape_string($conn, $_POST['password']);
    
    // FETCH DATABASE
    $sql = "SELECT * FROM users WHERE email = '$email'";
    $result = $conn->query($sql);

    if ($result) {
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();

            // check the password is correct
            if (password_verify($password, $user['password'])) {
                echo "Login successful, Welcome " . $user['username'];
                echo "<script>
                        alert('Login successful!');
                        window.location.href = 'bookie.html';
                      </script>"; 
                exit(); // Prevent further execution
            } else {
                echo "Wrong password";
            }
        } else {
            echo "No user with that email";
        }
    } else {
        echo "Error executing query: " . $conn->error; // Handle query error
    }
}
?>