document.addEventListener('DOMContentLoaded', function () {
    const toolsButton = document.getElementById('tools');
    const toolCategories = document.getElementById('toolCategories');
    const rezcySubcategories = document.getElementById('rezcySubcategories');
    const plastinySubcategories = document.getElementById('plastinySubcategories');
    const rezcyButton = document.getElementById('rezcyButton');
    const plastinyButton = document.getElementById('plastinyButton');
  
    toolsButton.addEventListener('click', function () {
      toolCategories.style.display = 'block';
      rezcySubcategories.style.display = 'none';
      plastinySubcategories.style.display = 'none';
    });
  
    rezcyButton.addEventListener('click', function () {
      rezcySubcategories.style.display = 'block';
      plastinySubcategories.style.display = 'none';
    });
  
    plastinyButton.addEventListener('click', function () {
      plastinySubcategories.style.display = 'block';
      rezcySubcategories.style.display = 'none';
    });
  });
  