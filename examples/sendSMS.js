const osms = require('../index');
const sms = new osms({ host: '192.168.88.251' });

const text = {
  ru: 'Привет привет привет привет привет привет привет привет привет привет привет привет привет привет привет привет привет привет привет',
  en: 'Hello, my darling!! How do you do? Im fine. Hello, my darling!! How do you do? Im fine. Hello, my darling!! How do you do? Im fine. Hello, my darling!! How do you do? Im fine. Hello, my darling!! How do you do? Im fine.',
  es: 'Dumbo, notificación de turno con Dr. Pluton Largo el martes 14 de agosto a las 15:30. Dirección: 9 de Julio 000, Z0000IMD Río Gallegos, Santa Cruz, Argentina. Teléfono: 2966 000111. ¡Gracias!',
};

sms.ami.on('connect', () => {
  console.log('connected?', sms.ami.isConnected());

  sms.sendSMS({ span: 1, number: '01166860534', text: text.es }, (error, response) => {
    console.log(error, response, 'Done!');

    sms.ami.disconnect(() => {
      console.log('close after sms');

      if (sms.ami.isConnected()) {
        console.log('connected');
      } else {
        console.log('not connected');
      }
    });
  });
});

sms.ami.on('close', (evt) => {
  console.log('close', evt);
});

sms.ami.on('end', (evt) => {
  console.log('end', evt);
});

sms.ami.on('error', (err) => {
  console.log('error', err);
});
