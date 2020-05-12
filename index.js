const admin = require("firebase/app");
require("firebase/database")
const storage = require("./lib/storage")


let db = {}

function H3FirebaseChat (options) {
    let opts = options || {}

    console.log("Entering initialization...");
    if (opts.credentials)
        admin.initializeApp(opts.credentials);
    db = admin.database();
}

async function createChat (chatInfo, participants = []) {
    let pushID = db.ref().push().key;
    // Crear coleccion del chat y retornar ID del chat
    await new Promise( resolve => {
        let notAdded = []
        if (!chatInfo) {
            chatInfo = {
                name: "",
            }
        }
        chatInfo.chatID = pushID;
        let doneCount = 0; // Counter of every participant registered
        chatDataRef (pushID).set(chatInfo).then(() => {
            participants.forEach(participant => {
                // Registrar para cada participante el ID del chat nuevo
                addUserToChat(participant.userID, pushID, chatData).catch(err => {
                    notAdded.push(participant)
                }).finally(() => {
                    doneCount++;
                    if (doneCount >= participants.length) {  // Very last iteration
                        resolve(pushID);
                    }
                })

            });
        })
        if (doneCount < participants.length)
            throw({err: "Algunos usuarios no pudieron ser añadidos", notAdded})
    })
    // Retornar ID del chat
}

async function addUserToChat (userID, chatID, chatData = {}) {
    if (Object.keys(chatData).length === 0 && chatData.constructor === Object) {
        chatData = {
            joinedTimestamp: admin.database.ServerValue.TIMESTAMP
        }
    }
    chatData.chatID = chatID;
    return new Promise (resolve => {
        userChatsDocument (userID).child(chatID).set(chatData).then(res => {
            resolve (res);
        }).catch(err => {
            throw err
        })
    })
}

function removeUserFromChat (userID, chatID) {
    return new Promise (resolve => {
        userChatsDocument (userID).child(chatID).removeValue().then(res => {
            resolve ({
                message: `The user ${userID} has been removed from ${chatID}`,
                res,
            });
        }).catch(err => {
            throw err
        })
    })
}

async function getChatIDs (userID) {
    let chats = [];
    return new Promise (resolve => {
        if (!userID) {
            chatDataRef().once('value').then(snapshot => {
                chats = snapshotToArray (snapshot);
                resolve (chats);
            })
        } else {
            db.ref(`h3-chat/${chatID}`).on('value', snapshot => {
                chats = snapshotToArray (snapshot);
                resolve (chats);
            })
        }
    })
}

async function deleteMessage (chatID, messageID, deleteFiles = true) {
    return new Promise (async resolve => {
        let messageData = {} 
        await chatsMessagesRef(`${chatID}/messages/${messageID}`).once("value").then(message => {
            messageData = message.val()
        })

        chatsMessagesRef(`${chatID}/messages/${messageID}`).remove().then((res) => {
            if (deleteFiles) {
                storage.removeFile (messageData.file.fullPath).then(removed => {
                    console.log("File removed", removed)
                })
                resolve(messageData);
            }
            resolve(messageData);
        })
    })
}

async function sendMessageFunction (chatID, content) {
    let uploadedFile = null;

    if (content.hasFile) {
        await storage.uploadFile(chatID, content.file, function (fileStatus) {
            return fileStatus.ref.getDownloadURL().then(url => {
                return {
                    bucket: fileStatus.metadata.bucket,
                    fullPath: fileStatus.metadata.fullPath,
                    downloadURL: url,
                    name: fileStatus.metadata.name,
                    createdAt: fileStatus.metadata.timeCreated,
                    size: fileStatus.metadata.size
                }
            }).catch(err => {
                throw {
                    message: "Unexpected error when uploading files",
                    error: err
                }
            })
        }).then(fileStatus => {
            uploadedFile = fileStatus
        }).catch(err => {
            throw {
                message: "Unexpected error when uploading files",
                error: err
            }
        })
    }

    let key = chatsMessagesRef(chatID).push().key;
    let snd = {...content};
    snd.file= uploadedFile
    snd.messageID = key;
    snd.timestamp = admin.database.ServerValue.TIMESTAMP

    // Check if chat extists and write the snd obj
    chatsMessagesRef(chatID).child("messages").child(key).set(snd).catch((err) => {
        throw {
            message: "Unexpected error when writing on the database",
            error: err
        }
    })
}

async function sendMessage (chatID, content, checkUserBelonging = false) {
    let belongs = false;
    if (checkUserBelonging) {
        await checkUserBelongsToChat (content.senderID, chatID).then(async res => { 
            belongs = res

            if (!belongs) {
                console.error("The user doesn't belong to this chat!")
                throw "The user doesn't belong to this chat!"
            }
            sendMessageFunction (chatID, content);
        })
    } else {
        sendMessageFunction (chatID, content);
    }
}

function getMessages (chatID, callback) {
    const chatRef = chatsMessagesRef (chatID).child("messages");

    chatRef.on('value', (docSnapshot) => {
        let messages = snapshotToArray (docSnapshot)
        callback (messages);
    });
}

function chatExists (chatID) {
    const chatRef = chatsMessagesRef (chatID);

    chatRef.get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            return true;
        }
        return false;
    });
}

async function checkUserBelongsToChat (userID, chatID) {
    let belongs = false

    if (!userID) {
        throw "User ID is null, cannot send the message";
    }

    if (!chatID) {
        throw "Chat ID is null, cannot send the message";
    }

    await db.ref(`h3-user-chats/${userID}/chats/${chatID}`).once('value').then(function(userChats) {
        let result = userChats.val()
        if (result)
            belongs = true
    }).catch(err => {
        throw {
            message: "Unexpected error when checking user rights on this chat",
            error: err
        }
    });

    return belongs
}

function userChatsDocument (userID) {
    return db.ref(`h3-user-chats/${userID}/chats`);
}

function chatsMessagesRef (chatID) {
    return db.ref(`h3-chats-messages/${chatID}`)
}

function chatDataRef (chatID) {
    if (chatID) {
        return db.ref(`h3-chats-data/${chatID}`)
    } else {
        return db.ref(`h3-chats-data`)
    }

}

function snapshotToArray(snapshot) {
    var returnArr = [];

    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        returnArr.push(item);
    });

    return returnArr;
};

exports = module.exports = H3FirebaseChat;
exports.createChat = createChat;
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
exports.storage = storage;
exports.getChatIDs = getChatIDs
exports.addUserToChat = addUserToChat
exports.removeUserFromChat = removeUserFromChat
exports.deleteMessage = deleteMessage