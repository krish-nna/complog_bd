document.addEventListener("DOMContentLoaded", () => {
    // Get competition id from URL (using ?compId=xxx)
    const urlParams = new URLSearchParams(window.location.search);
    const competitionId = urlParams.get('compId');
    console.log("Competition ID:", competitionId);

    // Add event listener for the upload button
    const uploadBtn = document.getElementById("upload-btn");
    if (uploadBtn) {
        uploadBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent form submission if inside a form
            console.log("Upload button clicked!");
            handleFileUpload();
        });
    }

    // File input change to display chosen file name
    const fileInput = document.getElementById("upload-file");
    const fileNameDisplay = document.getElementById("file-name");
    if(fileInput && fileNameDisplay) {
      fileInput.addEventListener("change", () => {
          if (fileInput.files.length > 0) {
              fileNameDisplay.textContent = fileInput.files[0].name;
          } else {
              fileNameDisplay.textContent = "";
          }
      });
    }

    // Get new filter elements by new IDs:
    const filterClass = document.getElementById("filterClass");
    const filterRank = document.getElementById("filterRank");

    // Create a master list for class names; once loaded, we use it to update the dropdown
    let masterClassList = new Set();

    // Update event listeners for filters
    filterClass.addEventListener("change", fetchStudents);
    filterRank.addEventListener("change", fetchStudents);

    // Function to fetch students from the server based on filters and competition id
    function fetchStudents() {
        const cls = filterClass.value !== "all" ? filterClass.value : "";
        const rank = filterRank.value === "top3" ? "top3" : "all"; // Handle rank filter

        const query = `compId=${competitionId}&filter_class=${encodeURIComponent(cls)}&filter_rank=${encodeURIComponent(rank)}`;
        fetch("fetch_students.php?" + query)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderStudents(data.students);
                    // If master list is empty, populate it with all classes from fetched data.
                    if (masterClassList.size === 0) {
                        data.students.forEach(student => masterClassList.add(student.class));
                        updateClassDropdown([...masterClassList]);
                    }
                } else {
                    showError(data.error);
                }
            })
            .catch(err => {
                showError("Error fetching students");
            });
    }

    // Function to transform rank for display
    function getRankDisplay(rank) {
        // Assuming rank is stored as a string from the enum
        if (rank === "0") {
            return { text: "Participant", bgClass: "green-bg" };
        } else if (rank === "1") {
            return { text: "1st rank", bgClass: "yellow-bg" };
        } else if (rank === "2") {
            return { text: "2nd rank", bgClass: "yellow-bg" };
        } else if (rank === "3") {
            return { text: "3rd rank", bgClass: "yellow-bg" };
        } else {
            return { text: rank, bgClass: "yellow-bg" };
        }
    }

    // Function to render student tiles
    function renderStudents(students) {
        const container = document.getElementById("categoryTiles");
        container.innerHTML = ""; // Clear previous tiles
        students.forEach(student => {
            const rankInfo = getRankDisplay(student.rank_status);
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.innerHTML = `
                <div class="student-card">
                    <p class="student-name"><u>${student.name}</u></p>
                    <p class="student-id"><strong>Student ID:</strong> ${student.student_id}</p>
                    <p class="student-class"><strong>Class:</strong> ${student.class}</p>
                    <p class="student-division"><strong>Division:</strong> ${student.division}</p>
                    <p class="student-rollno"><strong>Roll No:</strong> ${student.rollno}</p>
                    <div class="rank-container">
                        <span class="rank-badge ${rankInfo.bgClass}">${rankInfo.text}</span>
                    </div>
                    <p class="email"><strong>Email:</strong> ${student.email}</p>
                    <p class="student-phone"><strong>Phone:</strong> ${student.phno}</p>
                    <div class="edit-btn" style="border: none; cursor: pointer;" data-tid="${student.tid}">
                        <img class="edit" src="edit.png" alt="Edit">
                    </div>
                </div>
            `;
            container.appendChild(tile);
        });
        // Bind edit button click events
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", openEditModal);
        });
    }

    // Function to update the class dropdown using the master list
    function updateClassDropdown(classes) {
        // Clear previous options and add default "All Classes"
        filterClass.innerHTML = `<option value="all">All Classes</option>`;
        classes.forEach(cls => {
            const option = document.createElement("option");
            option.value = cls;
            option.textContent = cls;
            filterClass.appendChild(option);
        });
    }

    // Function to show errors
    function showError(message) {
        const errorDiv = document.getElementById("error-message");
        errorDiv.textContent = message;
        setTimeout(() => {
            errorDiv.textContent = "";
        }, 5000);
    }

    // Function to open the edit modal and prefill with student data
    function openEditModal(e) {
        const tid = e.target.closest(".edit-btn").getAttribute("data-tid");
        // Use closest to find the student-card container
        const tile = e.target.closest(".student-card");
        if (!tile) {
            console.error("Tile not found!");
            return;
        }

        // Extract fields using unique class selectors
        const nameEl = tile.querySelector(".student-name");
        const classEl = tile.querySelector(".student-class");
        const divisionEl = tile.querySelector(".student-division");
        const rollnoEl = tile.querySelector(".student-rollno");
        const emailEl = tile.querySelector(".email");
        const phoneEl = tile.querySelector(".student-phone");
        const rankEl = tile.querySelector("span.rank-badge");

        const name = nameEl ? nameEl.textContent.replace(/<[^>]*>/g, "").trim() : "";
        const classText = classEl ? classEl.textContent.split(": ")[1] : "";
        const divisionText = divisionEl ? divisionEl.textContent.split(": ")[1] : "";
        const rollnoText = rollnoEl ? rollnoEl.textContent.split(": ")[1] : "";
        const email = emailEl ? emailEl.textContent.split(": ")[1] : "";
        const phoneText = phoneEl ? phoneEl.textContent.split(": ")[1] : "";
        const rank_status = rankEl ? rankEl.textContent : "";

        if (!name || !classText || !divisionText || !rollnoText || !email || !phoneText) {
            console.error("Some student details are missing!");
            return;
        }

        // Create modal content dynamically
        const modal = document.createElement("div");
        modal.classList.add("modal");
        modal.style.display = "flex"; // Ensure modal is visible
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h3>Edit Student</h3>
                <form id="edit-form">
                    <input type="hidden" name="tid" value="${tid}">
                    <label>Name: <input type="text" name="name" value="${name}" required></label>
                    <label>Class: <input type="text" name="class" value="${classText}" required></label>
                    <label>Division: <input type="text" name="division" value="${divisionText}" required></label>
                    <label>Roll No: <input type="number" name="rollno" value="${rollnoText}" required></label>
                    <label>Email: <input type="email" name="email" value="${email}" required></label>
                    <label>Phone: <input type="text" name="phno" value="${phoneText}" required></label>
                    <label>Rank Status: 
                        <select name="rank_status" required>
                            <option value="1" ${rank_status === "1st rank" ? 'selected' : ''}>1</option>
                            <option value="2" ${rank_status === "2nd rank" ? 'selected' : ''}>2</option>
                            <option value="3" ${rank_status === "3rd rank" ? 'selected' : ''}>3</option>
                            <option value="0" ${rank_status === "Participant" ? 'selected' : ''}>Participant</option>
                        </select>
                    </label>
                    <button type="submit">Save Changes</button>
                    <button type="button" id="delete-btn">Delete</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal event
        modal.querySelector(".close-btn").addEventListener("click", () => {
            modal.remove();
        });

        // Handle form submission (update)
   // Handle form submission (update)
modal.querySelector("#edit-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    console.log("Edit form submitted"); // Debug log
    const formData = new FormData(this);
    console.log("FormData:", formData); // Debug log
    fetch("update_students.php", {
        method: "POST",
        body: formData
    })
        .then(response => {
            console.log("Update response:", response); // Debug log
            return response.json();
        })
        .then(data => {
            console.log("Update data:", data); // Debug log
            if (data.success) {
                modal.remove();
                fetchStudents();
            } else {
                showError(data.error);
            }
        })
        .catch(err => {
            console.error("Update error:", err); // Debug log
            showError("Error updating student");
        });
});

        // Handle deletion
        modal.querySelector("#delete-btn").addEventListener("click", function () {
            console.log("Delete button clicked");
            console.log("TID to delete:", tid);
        
            if (confirm("Are you sure you want to delete this student?")) {
                const formData = new FormData();
                formData.append("tid", tid);
                console.log("Delete FormData:", formData);
        
                fetch("delete_students.php", {
                    method: "POST",
                    body: formData
                })
                    .then(response => {
                        console.log("Delete response:", response);
                        return response.json();
                    })
                    .then(data => {
                        console.log("Delete data:", data);
                        if (data.success) {
                            modal.remove();
                            fetchStudents();
                        } else {
                            showError(data.error);
                        }
                    })
                    .catch(err => {
                        console.error("Delete error:", err);
                        showError("Error deleting student");
                    });
            }
        });
    }

    // Handle Excel file upload
    function handleFileUpload() {
        console.log("handleFileUpload function called!");

        const fileInput = document.getElementById("upload-file");
        console.log("File input element:", fileInput);

        if (!fileInput) {
            console.error("File input not found!");
            showError("File input element is missing.");
            return;
        }

        const file = fileInput.files[0];
        console.log("Selected file:", file);

        if (!file) {
            showError("Please choose an Excel file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("excel_file", file);
        formData.append("competition_id", competitionId);

        console.log("FormData:", formData);

        fetch("save_students.php", {
            method: "POST",
            body: formData
        })
            .then(response => {
                console.log("Fetch response received:", response);
                return response.json();
            })
            .then(data => {
                console.log("Server response data:", data);
                if (data.success) {
                    fetchStudents(); // Refresh the student list after upload
                } else {
                    showError(data.error);
                }
            })
            .catch((err) => {
                console.error("Fetch error:", err);
                showError("Error uploading file.");
            });
    }

    // Initially fetch students for the competition
    fetchStudents();
});
