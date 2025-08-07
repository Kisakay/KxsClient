#!/bin/bash

# Define variables
CONFIG_FILE="./config.json"
CURRENT_DIR="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get parent directory (assumes this script is in KxsClient)
GITHUB_PARENT="$(dirname "$SCRIPT_DIR")"
WEBSITE_FOLDER="KxsWebsite"
WEBSITE_PATH="${GITHUB_PARENT}/${WEBSITE_FOLDER}"
INDEX_SCRIPT_FILE="${WEBSITE_PATH}/download/latest-dev.js"

# Extract fileName from config.json
FILE_NAME=$(node -e "console.log(require('${CONFIG_FILE}').fileName)")

# Define path to the compiled client file
CLIENT_PATH="${SCRIPT_DIR}/dist/${FILE_NAME}"

# Compile the client
echo "Compiling client..."
npx webpack

if [ $? -ne 0 ]; then
	echo "Error: Webpack compilation failed"
	exit 1
fi

if [ ! -f "$CLIENT_PATH" ]; then
	echo "Error: Client file not found at ${CLIENT_PATH}"
	exit 1
fi

echo "Updating client in website folder..."
cp "$CLIENT_PATH" "$INDEX_SCRIPT_FILE"

if [ $? -ne 0 ]; then
	echo "Error: Failed to copy client to website folder"
	exit 1
fi

echo "Pushing changes to repository..."
cd "$WEBSITE_PATH" || {
	echo "Error: Could not change to website directory"
	exit 1
}

git add .
git commit -m "Update the client"
git push

if [ $? -ne 0 ]; then
	echo "Error: git push failed"
	exit 1
fi

echo "Client updated successfully!"
