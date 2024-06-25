document.addEventListener('DOMContentLoaded', async () => {
    const contentContainer = document.getElementById('contentContainer');
    const requestsButton = document.getElementById('requests');
    const toolsButton = document.getElementById('tools');

    // Получение конфигурации из контекста главного процесса
    try {
        const config = await window.api.getConfig();

        // Убедитесь, что WebSocket доступен
        if (typeof WebSocket !== 'undefined') {
            const ws = new WebSocket(`ws://${config.serverAddress.split('/')[2]}`); // Используем серверный адрес из конфигурации

            ws.onopen = () => {
                console.log('WebSocket connection established');
            };

            ws.onmessage = (event) => {
                console.log('WebSocket message received:', event.data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };
        } else {
            console.error('WebSocket is not available in this environment');
        }
    } catch (error) {
        console.error('Error fetching configuration:', error);
    }

    requestsButton.addEventListener('click', async () => {
        hideAllSections();
        await loadRequestsHtml();
    });

    toolsButton.addEventListener('click', async () => {
        hideAllSections();
        await loadToolsHtml();
    });

    async function loadRequestsHtml() {
        try {
            const response = await fetch('requests.html'); // или `${config.serverAddress}/requests.html` если используете конфигурацию
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;
        } catch (error) {
            console.error('Ошибка при загрузке requests.html:', error);
        }
    }

    async function loadToolsHtml() {
        try {
            const response = await fetch('tools.html'); // или `${config.serverAddress}/tools.html` если используете конфигурацию
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;
        } catch (error) {
            console.error('Ошибка при загрузке tools.html:', error);
        }
    }

    function hideAllSections() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }
});
