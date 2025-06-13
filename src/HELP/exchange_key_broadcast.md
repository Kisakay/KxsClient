# KxsClient Update `2.2.4`

> *Some minor improvements and new features*

## Chat improvements
* The chat can now be moved freely around the screen
* Message limit is now calculated based on the chat box size
* Fixed an issue with pressing Enter and mouse clicks

## New Developer Feature: Exchange Key System

The Exchange Key system allows you to automatically notify your bots when you join a game!

### How it works
* When you join a game, KxsClient sends the game ID to the server
* Any bot using your Exchange Key receives a notification with the game ID
* Your bot can automatically join the same game

### Setting up your bot
```javascript
// Initialize with your Exchange Key
const kxs = new KxsNetwork({
    wsUrl: 'wss://network.kxs.rip',
    username: 'YourBot',
    exchangeKey: "YOUR_EXCHANGE_KEY" // From Developer Options
});

// Listen for game join events
kxs.on("exchangeUpdate", (data) => {
    // Automatically join the same game
    kxs.joinGame(data.gameId);
});
```

### Managing your Exchange Key
* **Renew Exchange Key**: Generate a new random key
* **Copy Exchange Key**: Copy your current key to clipboard

Find these options in the Developer section of your client settings!
