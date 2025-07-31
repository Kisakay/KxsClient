#!/bin/bash

# Define variables
WEBSITE_FOLDER="KxsWebsite"
CONFIG_FILE="./config.json"
CURRENT_DIR="$(pwd)"

# Extract fileName from config.json
FILE_NAME=$(node -e "console.log(require('${CONFIG_FILE}').fileName)")

# Define paths
CLIENT_PATH="${CURRENT_DIR}/dist/${FILE_NAME}"
WEBSITE_PATH="${HOME}/Documents/GitHub/${WEBSITE_FOLDER}"
INDEX_SCRIPT_FILE="${WEBSITE_PATH}/download/latest-dev.js"

# Compile the client
echo "Compiling client..."
npx webpack

# Check if compilation was successful
if [ $? -ne 0 ]; then
	echo "Error: Webpack compilation failed"
	exit 1
fi

# Check if client file exists
if [ ! -f "$CLIENT_PATH" ]; then
	echo "Error: Client file not found at ${CLIENT_PATH}"
	exit 1
fi

# Copy client file to website folder
echo "Updating client in website folder..."
cp "$CLIENT_PATH" "$INDEX_SCRIPT_FILE"

# Check if copy was successful
if [ $? -ne 0 ]; then
	echo "Error: Failed to copy client to website folder"
	exit 1
fi

# Push changes to repository
echo "Pushing changes to repository..."
cd "$WEBSITE_PATH" || {
	echo "Error: Could not change to website directory"
	exit 1
}

git add .
if [ $? -ne 0 ]; then
	echo "Error: git add failed"
	exit 1
fi

git commit -m "Update the client"
if [ $? -ne 0 ]; then
	echo "Error: git commit failed"
	exit 1
fi

git push
if [ $? -ne 0 ]; then
	echo "Error: git push failed"
	exit 1
fi

echo "Client updated successfully!"
