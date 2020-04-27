const admin = require("firebase");
const storage = require("./lib/storage")

let db = {}

function H3FirebaseChat (options) {
    let opts = options || {}

    console.log("Entering initialization...");
    admin.initializeApp(opts.credentials);
    db = admin.database();
}

async function createChat (participants) {
    let serverTimestamp = admin.database.ServerValue.TIMESTAMP
    let pushID = db.ref().push().key;
    // Crear coleccion del chat y retornar ID del chat
    await new Promise( resolve => {
        let doneCount = 0; // Counter of every participant registered
        participants.forEach(async participant => {
            const chatData = {
                chatID: pushID,
                joinedTimestamp: serverTimestamp
            }
            // Registrar para cada participante el ID del chat nuevo
            await userChatsDocument (participant.userID).child(pushID)
            .set(chatData)
            .then(res => {

                console.log("Chat del usuario " + participant.userID + " registrado")
            }).catch(err => {
                console.log("Error " + err)
            }).finally(() => {
                doneCount++;
                if (doneCount >= participants.length) {
                    resolve();
                }
            })

        });
    })
    return pushID;
    // Retornar ID del chat
}

function addUserToChat (user, chatID) {
    // Registrar en el usuario que pertecene a un nuevo chat
}

function removeUserFromChat (user, chatID) {

}

async function getChatIDs (userID) {
    let chats = [];
    if (!userID) {
        await db.ref(`h3-chat`).on('value', snapshot => {
            chats = snapshotToArray (snapshot);
        })
    } else {
        await db.ref(`h3-chat/${chatID}`).on('value', snapshot => {
            chats = snapshotToArray (snapshot);
        })
    }
    return chats;
}

async function sendMessage (chatID, content) {
    let belongs = false;

    await checkUserBelongsToChat (content.senderID, chatID).then(async res => { 
        belongs = res

        if (!belongs) {
            console.log("The user doesn't belong the this chat!")
            throw "The user doesn't belong the this chat!"
        }
        let uploadedFile = null;

        if (content.hasFile) {
            await storage.uploadFile(chatID, content.file, function (fileStatus) {
                return fileStatus.ref.getDownloadURL().then(url => {
                    console.log("Upload", fileStatus,  url)
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

        let snd = {...content};
        snd.file= uploadedFile
        snd.timestamp = admin.database.ServerValue.TIMESTAMP

        // Check if chat extists and write the snd obj
        chatDocument(chatID).child("messages").push(snd).catch((err) => {
            throw {
                message: "Unexpected error when writing on the database",
                error: err
            }
        })
    })
}

function getMessages (chatID, callback) {
    const chatRef = chatDocument (chatID).child("messages");

    chatRef.on('value', (docSnapshot) => {
        let messages = snapshotToArray (docSnapshot)
        callback (messages);
    });
}

function chatExists (chatID) {
    const chatRef = chatDocument (chatID);

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

function chatDocument (chatID) {
    return db.ref(`h3-chat/${chatID}`)
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
exports.getChatIDs = getChatIDs;