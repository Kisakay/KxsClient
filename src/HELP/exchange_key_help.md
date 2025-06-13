# Exchange Key System

## What is the Exchange Key?

The Exchange Key is a powerful developer feature that allows you to connect your KxsClient with external applications or bots. When enabled, it automatically notifies your applications when you join a game, sending them the game ID.

## How It Works

1. **Generate a Unique Key**: Each client has a unique Exchange Key that serves as a secure identifier

2. **Enable the Feature**: Make sure the "Enable Game ID Exchange" option is turned on in Developer Options

3. **Automatic Game ID Sharing**: When you join a game, KxsClient automatically sends the game ID to the KxsNetwork server along with your Exchange Key

4. **Bot Notification**: Any connected application using the same Exchange Key will receive a notification with the game ID, allowing it to join the same game

## Setting Up Your Bot

To connect your bot to the Exchange Key system:

```javascript
// Initialize KxsNetwork with your Exchange Key
const kxs = new KxsNetwork({
    wsUrl: 'wss://network.kxs.rip',
    apiUrl: 'https://network.kxs.rip',
    username: 'YourBotName',
    exchangeKey: "YOUR_EXCHANGE_KEY_HERE" // Copy this from your client
});

// Listen for game join events
kxs.on("exchangeUpdate", (data) => {
    console.log(`Game joined: ${data.gameId}`);
    
    // Automatically join the same game
    kxs.joinGame(data.gameId);
    
    // Your bot logic here
});
```

## Managing Your Exchange Key

In the client settings under Developer Options:

- **Renew Exchange Key**: Generate a new random key (will be copied to clipboard)
- **Copy Exchange Key**: Copy your current key to clipboard for use in your applications
- **Enable Game ID Exchange**: Toggle to enable/disable the feature

## Use Cases

1. **Automated Bot Joining**: Have your bot automatically join your games
2. **Game Analytics**: Track your game participation with external tools
3. **Custom Notifications**: Set up alerts when you join specific game types
4. **Multi-Client Coordination**: Synchronize multiple clients or bots

## Security Note

Keep your Exchange Key private. Anyone with your key can receive notifications about games you join. If you suspect your key has been compromised, use the "Renew Exchange Key" option to generate a new one.

## Troubleshooting

If your bot is not receiving game notifications:

1. Verify that "Enable Game ID Exchange" is turned on
2. Confirm that your bot is using the correct Exchange Key
3. Check that your bot is properly connected to the KxsNetwork
4. Ensure your bot has the correct event listener for "exchangeUpdate"

## Technical Details

The Exchange Key system uses a secure websocket connection to transmit game IDs. When you join a game, the client sends an HTTP request to the KxsNetwork server with your game ID and Exchange Key. The server then broadcasts this information to all connected clients that share the same Exchange Key.
