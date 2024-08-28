// forge.dev.config.js
module.exports = {
    packagerConfig: {
      name: "Elpa&KvartsServer",
      executableName: "ElpaKvartsWithServer",
      icon: "./path/to/icon.ico", // Укажите путь к иконке
      afterCopy: [
        async (buildPath, electronVersion, platform, arch) => {
          const fs = require('fs');
          const path = require('path');
  
          const mainFilePath = path.join(buildPath, 'main.js');
          const serverFilePath = path.join(buildPath, 'server.js');
  
          const combinedScript = `
            const { fork } = require('child_process');
            const path = require('path');
  
            // Запускаем server.js
            const serverProcess = fork(path.join(__dirname, 'server/server.js'));
  
            // Продолжаем запуск main.js
            ${fs.readFileSync(mainFilePath, 'utf8')}
          `;
  
          fs.writeFileSync(mainFilePath, combinedScript, 'utf8');
        }
      ]
    },
    makers: [
      {
        name: "@electron-forge/maker-zip",
        platforms: ["win32"]
      },
    ],
  };
  