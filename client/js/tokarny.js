let toolsData = {}; // Tool database
let selectedCategory = '';
let selectedSubcategory = '';
let selectedSize = '';
let selectedTool = '';
let selectedShape = '';
let selectedAngle = '';
let userRole = ''; // User role

// Function to toggle add tool form based on user role
function toggleAddToolForm() {
    const addToolForm = document.getElementById('addToolForm');
    if (userRole === 'Admin') {
        addToolForm.style.display = 'block';
    } else {
        addToolForm.style.display = 'none';
    }
}

// Call toggleAddToolForm function to show or hide form on page load
toggleAddToolForm();

// Function to set up event listeners for tools interaction
function setupEventListeners() {
    document.getElementById('tools').addEventListener('click', function () {
        hideAllSections();
        document.getElementById('toolCategories').style.display = 'block';
    });

    document.getElementById('toolCategories').addEventListener('click', function (event) {
        selectedCategory = event.target.id;
        if (selectedCategory === 'tokarny' || selectedCategory === 'plastiny') {
            // Display subcategories based on selected category
            displaySubcategories(selectedCategory);
            hideToolDetails();
        }
    });

    document.getElementById('tokarnySubcategories').addEventListener('click', function (event) {
        selectedSubcategory = event.target.id;
        displaySizeSelection();
        hideToolDetails();
    });

    document.querySelectorAll('.size-option').forEach(function (sizeOption) {
        sizeOption.addEventListener('click', function () {
            selectedSize = sizeOption.getAttribute('data-size');
            console.log(`Selected Size: ${selectedSize}`);
            displayToolDetails();
            hideToolSelection();
            displayToolsList();
        });
    });

    document.querySelectorAll('.shape-option').forEach(function (shapeOption) {
        shapeOption.addEventListener('click', function () {
            selectedShape = shapeOption.getAttribute('data-shape');
            console.log(`Selected Shape: ${selectedShape}`);
            displayAngleSelection(selectedShape);
        });
    });

    document.querySelectorAll('.angle-option').forEach(function (angleOption) {
        angleOption.addEventListener('click', function () {
            selectedAngle = angleOption.getAttribute('data-angle');
            console.log(`Selected Angle: ${selectedAngle}`);
            showAvailability();
        });
    });

    document.getElementById('addToolForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const toolName = document.getElementById('toolName').value.trim();
        const toolQuantity = parseInt(document.getElementById('toolQuantity').value);

        if (toolName && !isNaN(toolQuantity)) {
            addToolToServer(toolName, toolQuantity);
        } else {
            console.error('Invalid tool name or quantity');
        }
    });
}

// Function to display subcategories based on selected category
function displaySubcategories(category) {
    const subcategoryList = document.getElementById(`${category}Subcategories`);
    if (subcategoryList) {
        subcategoryList.style.display = 'block';
        hideToolDetails();
    }
}

// Function to display size selection
function displaySizeSelection() {
    document.getElementById('sizeSelection').style.display = 'block';
    hideToolDetails();
}

// Function to hide tool details
function hideToolDetails() {
    document.getElementById('toolDetails').style.display = 'none';
}

// Function to display tool details
function displayToolDetails() {
    document.getElementById('toolDetails').style.display = 'block';
}

// Function to hide tool selection
function hideToolSelection() {
    document.getElementById('sizeSelection').style.display = 'none';
}

// Function to display tools list based on selected parameters
function displayToolsList() {
    // Replace this with your actual data fetching and display logic
    console.log('Displaying tools list');
}

// Function to display angle selection based on selected shape
function displayAngleSelection(shape) {
    // Replace this with your actual logic for displaying angle selection
    console.log('Displaying angle selection');
}

// Function to show tool availability
function showAvailability() {
    // Replace this with your actual logic for showing tool availability
    console.log('Showing tool availability');
}

// Function to add tool to server
function addToolToServer(toolName, toolQuantity) {
    // Replace this with your actual logic to add tool to server
    console.log(`Adding tool to server - Name: ${toolName}, Quantity: ${toolQuantity}`);
}

// Function to hide all sections except add tool form
function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Exporting setupEventListeners function
export { setupEventListeners };
