document.addEventListener('DOMContentLoaded', function () {
  const toolsButton = document.getElementById('tools');
  const toolCategories = document.getElementById('toolCategories');
  const toolDetails = document.getElementById('toolDetails');
  const otreznoyDetails = document.getElementById('otreznoyDetails');
  const prohodnoyDetails = document.getElementById('prohodnoyDetails');

  toolsButton.addEventListener('click', function () {
    if (toolCategories.style.display === 'none') {
      toolCategories.style.display = 'block';
      toolDetails.style.display = 'none'; // Скрываем информацию о типах инструментов при открытии меню инструментов
      otreznoyDetails.style.display = 'none';
      prohodnoyDetails.style.display = 'none';
    } else {
      toolCategories.style.display = 'none';
      toolDetails.style.display = 'none'; // Скрываем информацию о деталях инструментов при повторном клике на кнопку "Склад инструментов"
    }
  });

  // Определяем обработчик событий для клика по элементам списка инструментов
  toolCategories.addEventListener('click', function (event) {
    const selectedTool = event.target.id; // Получаем ID выбранного инструмента

    // Отправляем запрос на сервер для получения списка инструментов выбранной категории
    fetch(`/api/tools/${selectedTool}`)
      .then(response => response.json())
      .then(tools => {
        // Отображаем информацию о выбранных инструментах
        toolDetails.style.display = 'block';
        if (selectedTool === 'otreznoy') {
          otreznoyDetails.style.display = 'block';
          prohodnoyDetails.style.display = 'none';
          // Заполните информацию о типе инструмента на основе полученных данных (например, характеристики и количество)
          document.getElementById('otreznoyCharacteristics').innerText = `Характеристики: ${tools[0].characteristics}`;
          document.getElementById('otreznoyQuantity').innerText = `В наличии: ${tools[0].quantity}`;
        } else if (selectedTool === 'prohodnoy') {
          prohodnoyDetails.style.display = 'block';
          otreznoyDetails.style.display = 'none';
          // Заполните информацию о типе инструмента на основе полученных данных (например, характеристики и количество)
          document.getElementById('prohodnoyCharacteristics').innerText = `Характеристики: ${tools[0].characteristics}`;
          document.getElementById('prohodnoyQuantity').innerText = `В наличии: ${tools[0].quantity}`;
        }
      })
      .catch(error => console.error('Ошибка:', error));
  });

  // Добавляем обработчик клика на блок toolDetails для его скрытия
  toolDetails.addEventListener('click', function () {
    toolDetails.style.display = 'none';
  });
});
