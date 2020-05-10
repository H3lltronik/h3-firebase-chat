const firebase = require("firebase/app");
require("firebase/storage")

async function uploadFile (chatID, file, callback) {
    let guid = uuidv4();
    return new Promise(resolve => {
        firebase.storage().ref(`h3-chats/${chatID}/${guid}`).put(file).then (res => {
            resolve( callback (res) );
        }).catch(err => {
            throw {
                message: "Unexpected error when uploading files",
                error: err
            }
        })
    });
}

async function removeFile (route) {
    return new Promise(resolve => {
        firebase.storage().ref(route).delete().then (res => {
            resolve( res );
        }).catch(err => {
            throw {
                message: "Unexpected error when removing files",
                error: err
            }
        })
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

exports = module.exports = uploadFile;
exports.uploadFile = uploadFile
exports.removeFile = removeFile