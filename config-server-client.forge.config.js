module.exports = {
    packagerConfig: {
      // Включаем и сервер, и клиент
      ignore: [
        // ничего не игнорируем, включаем все файлы
      ]
    },
    makers: [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['win32'],
      }
    ]
  };
  