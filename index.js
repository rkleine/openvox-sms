const AsteriskManager = require('asterisk-manager');

const Server = function ({ host = 'localhost', port = 5038, username = 'admin', password = 'admin' }) {
  this.SMS_SIZE = 160;
  this.CSMS_SIZE = 160 - 8;

  this.ami = new AsteriskManager(port, host, username, password, true);

  this.send = (action, callback) => {
    this.ami.action(action, callback);
  };

  this.validateOptionsForShortSMS = ({ span, number, text, timeout }) => {
    if (!span || !number ||  !text || !timeout) {
      throw new Error('No required options');
    }

    if (text.length > this.SMS_SIZE) {
      throw new Error('SMS size is over');
    }
    
    return true;
  };

  this.validateOptionsForCSMS = ({ span, number, text, smscount, smssequence, timeout }) => {
    if (!span || !number || !text || !smscount || !smssequence || !timeout) {
      throw new Error('No required options');
    }

    if (text.length > this.CSMS_SIZE) {
      throw new Error('CSMS size is over');
    }

    return true;
  };

  this.getSendSMSCommand = ({ span, number, text, timeout = 10000, id }) => 
    `gsm send sync sms ${span} ${number} "${text}" ${timeout} ${id || ''}`.trim();

  this.getSendCSMSCommand = ({ span, number, text, flag, smscount, smssequence, timeout = 10000 }) => 
    `gsm send sync csms ${span} ${number} "${text}" ${flag} ${smscount} ${smssequence} ${timeout}`;

  this.sendShortSMS = (options, callback) => {
    options.timeout = options.timeout || '10000';
    this.validateOptionsForShortSMS(options);

    var action = {
      action: 'Command',
      command: this.getSendSMSCommand(options)
    };

    this.send(action, callback);
  };

  this.sendCSMS = (options, callback) => {
    this.validateOptionsForCSMS(options);

    var action = {
      action: 'Command',
      command: this.getSendCSMSCommand(options)
    };

    this.send(action, callback);
  };

  this.isASCII = str => /^[\x00-\x7F]*$/.test(str);

  this.splitText = text => text.match(new RegExp('.{1,' + this.CSMS_SIZE + '}', 'g'));

  this.prepareCSMSArray = ({ text, span, number, timeout = 10000 }) => 
    this.splitText(text).map((text, i, array) => ({
      span,
      number,
      text,
      flag: 0,
      smscount: array.length,
      smssequence: i + 1,
      timeout
    }))

  this.sendLongSMS = (options, callback) => {
    var responses = [], errors = [];

    this.prepareCSMSArray(options).map((csms, i, array) => {
      this.sendCSMS(csms,  (error, response) => {
         responses.push(response);
         if (error) errors.push(error);

         if (i == array.length - 1) {
            if (errors.length == 0) {
              callback(null, responses);
            } else {
              callback(errors, responses);
            }
         }
      });
    }, this);
  };

  this.setSMSsize = (text) => {
    if (!this.isASCII(text)) {
      this.SMS_SIZE = 70;     //16bit
      this.CSMS_SIZE = 70 - 3;
    } else {
      this.SMS_SIZE = 160;     //7bit
      this.CSMS_SIZE = 160 - 8;
    };
  };

  this.isLongSMSText = text => text.length > this.SMS_SIZE;

  this.validate = ({ text, number, span }) => !!text && !!number && !!span;

  this.sendSMS = (options, callback) => {
    if (this.validate(options)) {
      this.setSMSsize(options.text);

      if (this.isLongSMSText(options.text)) {
        this.sendLongSMS(options, callback);
      } else {
        this.sendShortSMS(options, callback);
      }

    } else {
      throw new Error('Not valid options');
    }
  };

  return this;
};

module.exports = Server;
