module.exports = {
    packagerConfig: {
      // Включаем только файлы для клиента
      ignore: [
        /server/,
        /node_modules/
      ]
    },
    makers: [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['win32'],
      }
    ]
  };
  