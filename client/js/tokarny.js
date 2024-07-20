// tokarny.js

function setupEventListeners() {
    const toolCategories = document.getElementById('toolCategories');
    const subcategories = document.getElementById('subcategories');
    const sizeSelection = document.getElementById('sizeSelection');
    const toolDetails = document.getElementById('toolDetails');
    const shapeSelection = document.getElementById('shapeSelection');
    const angleSelection = document.getElementById('angleSelection');
    const availability = document.getElementById('availability');
    const addToolForm = document.getElementById('addToolForm');
  
    if (!toolCategories) {
      console.error('Tool categories section not found!');
      return;
    }
  
    // Setup category event listeners
    toolCategories.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('subcategory')) {
        hideAllSubsections();
        if (target.id === 'tokarny') {
          document.getElementById('tokarnySubcategories').style.display = 'block';
        }
      }
    });
  
    // Setup subcategory event listeners
    subcategories.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('subcategory-item')) {
        hideAllSubsections();
        sizeSelection.style.display = 'block';
      }
    });
  
    // Setup size option event listeners
    sizeSelection.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('size-option')) {
        hideAllSubsections();
        shapeSelection.style.display = 'block';
      }
    });
  
    // Setup shape option event listeners
    shapeSelection.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('shape-option')) {
        hideAllSubsections();
        angleSelection.style.display = 'block';
      }
    });
  
    // Setup angle option event listeners
    angleSelection.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('angle-option')) {
        hideAllSubsections();
        availability.style.display = 'block';
      }
    });
  
    // Setup tool details event listeners
    toolDetails.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('tool-item')) {
        // Display tool details here
      }
    });
  
    // Setup form submission event listeners
    addToolForm.addEventListener('submit', (event) => {
      event.preventDefault();
      // Handle form submission here
    });
  
    function hideAllSubsections() {
      const sections = [subcategories, sizeSelection, toolDetails, shapeSelection, angleSelection, availability, addToolForm];
      sections.forEach(section => {
        section.style.display = 'none';
      });
    }
  }
  
  export { setupEventListeners };
  