**This package was made by an inexperienced young programmer, I don't recommend you to use this in a real project**

# INCOMPLETE DOCUMENTATION, SORRY!

## H3 Firebase Chat

This package allows you create a chat with file sending using Firebase Realtime Database and Firebase Storage.

# Usage
```javascript
import H3Chat from 'h3-firebase-chat'
```

### Initialization
```javascript
H3Chat({
    credentials: {
      apiKey: "apiKeyFromFirebase",
      authDomain: "authDomainFromFirebase",
      databaseURL: "databaseURLFromFirebase",
      projectId: "databaseURLFromFirebase",
      storageBucket: "storageBucketFromFirebase",
      messagingSenderId: "messagingSenderIdFromFirebase",
      appId: "appIdFromFirebase"
    }
});
```

## Methods

createChat
===
>async function createChat (chatInfo, participants = [])

Will create a chat node in the database

* chatInfo

    * Is the object that holds the chat data that you want to store in the database
    * Default: 
        ```javascript
            chatInfo: {
                name: "" 
            }
        ```
* participants (optional)

    * Array of "users" that will be asing to this chat inmediately after the creation of the chat

* Example
```javascript
function createChat () {
    H3Chat.createChat({
        name: "Horny chat",
        otherAttr: "Some random value",
        randObj: {
            test: "Why am I a test?"
        }
    }).then(() => {
        alert("Chat created!")
    })
}
```

getChatIDs
===

> async function getChatIDs (userID)

Returns an array of all the chats IDs from an user if ```userID``` is not null, otherwise, it will return all chat IDs from the database

* userID (optional)

    * Represents the ID from an user that belongs to a chat

* Example
```javascript
function H3Chat.getChatIDs().then((chatsID) => {
    if (chatsID.length > 0) {
        this.chatsID = chatsID;
    }
})
```

addUserToChat
===
>async function addUserToChat (userID, chatID, chatData = {})

Will register in the database, inside the user's chats node, a new node with the chatID as UID and inside it it will add the given chatData 

* userID

    * Represents the ID from an user that belongs to a chat (MUST EXISTS)

* chatID

    * Represents the ID from a chat node in the database (MUST EXISTS)

* chatData (optional)

    * default: ```{}``` *if it is empty, it will auto write ```{ joinedTimestamp: SERVER_TIMESTAMP }```*

* Example

```javascript
function addUserToChat () {
    H3Chat.addUserToChat(userForm.userID, actualChat.chatID)
    .then(() => {
        alert("User added successfully")
    });
},
```

sendMessage
===

>async function sendMessage (chatID, content, checkUserBelonging = false)

Sends a message

* chatID

    * Represents the ID from a chat node in the database (MUST EXISTS)

* content

    * Message data object 

        *   Used attributes:
            ```javascript
            {
                hasFile: Boolean,
                file: File Reference // (just like button's type file does)
            }
            ```
            if ```hasFile``` is  true it will upload the file to your Firebase Storage and will write in the database a node called ```file``` that will have the following data
            ```javascript
            {
                bucket: firestoreBucket,
                fullPath: refFullPathOfFile,
                downloadURL: availableDownloadURL,
                name: filename,
                createdAt: timestampWhenCreated,
                size: fileSize
            }
            ```

* checkUserBelonging (optional)