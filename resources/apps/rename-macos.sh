#!/bin/bash

# Set the base directory where the DMG files are located
DMG_BASE_DIR="./tauri/target"

# Check if the directory exists
if [ ! -d "$DMG_BASE_DIR" ]; then
    echo "Error: Directory $DMG_BASE_DIR does not exist"
    exit 1
fi

# Find all DMG files recursively in the target directory
find "$DMG_BASE_DIR" -name "mah_*.dmg" -type f | while read -r dmg_file; do
    # Extract the filename from the full path
    filename=$(basename "$dmg_file")
    dir_path=$(dirname "$dmg_file")

    # Check if filename matches expected pattern: mah_version_architecture.dmg
    if [[ $filename =~ ^mah_([0-9]+\.[0-9]+\.[0-9]+)_([a-zA-Z0-9_]+)\.dmg$ ]]; then
        version="${BASH_REMATCH[1]}"
        architecture="${BASH_REMATCH[2]}"

        # Replace dots with underscores in version
        version_underscores="${version//./_}"

        # Create new filename
        new_filename="macos-mah-${version_underscores}-${architecture}.dmg"
        new_filepath="$dir_path/$new_filename"

        # Rename the file
        if mv "$dmg_file" "$new_filepath"; then
            echo "Successfully renamed: $filename -> $new_filename"
        else
            echo "Error: Failed to rename $filename"
            exit 1
        fi
    else
        echo "Warning: Skipping file that doesn't match expected pattern: $filename"
    fi
done
