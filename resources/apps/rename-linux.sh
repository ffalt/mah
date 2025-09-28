#!/bin/bash

# Set the base directory where the Linux files are located
LINUX_BASE_DIR="./tauri/target"

# Check if the directory exists
if [ ! -d "$LINUX_BASE_DIR" ]; then
    echo "Error: Directory $LINUX_BASE_DIR does not exist"
    exit 1
fi

# Find and process DEB files
find "$LINUX_BASE_DIR" -name "mah_*.deb" -type f | while read -r deb_file; do
    # Extract the filename from the full path
    filename=$(basename "$deb_file")
    dir_path=$(dirname "$deb_file")

    # Check if filename matches expected pattern: mah_version_architecture.deb
    if [[ $filename =~ ^mah_([0-9]+\.[0-9]+\.[0-9]+)_([a-zA-Z0-9_]+)\.deb$ ]]; then
        version="${BASH_REMATCH[1]}"
        architecture="${BASH_REMATCH[2]}"

        # Replace dots with underscores in version
        version_underscores="${version//./_}"

        # Create new filename
        new_filename="linux-mah-${version_underscores}-${architecture}.deb"
        new_filepath="$dir_path/$new_filename"

        # Rename the file
        if mv "$deb_file" "$new_filepath"; then
            echo "Successfully renamed DEB: $filename -> $new_filename"
        else
            echo "Error: Failed to rename DEB file $filename"
            exit 1
        fi
    else
        echo "Warning: Skipping DEB file that doesn't match expected pattern: $filename"
    fi
done

# Find and process RPM files
find "$LINUX_BASE_DIR" -name "mah-*.rpm" -type f | while read -r rpm_file; do
    # Extract the filename from the full path
    filename=$(basename "$rpm_file")
    dir_path=$(dirname "$rpm_file")

    # Check if filename matches expected pattern: mah-version-1.architecture.rpm
    if [[ $filename =~ ^mah-([0-9]+\.[0-9]+\.[0-9]+)-1\.([a-zA-Z0-9_]+)\.rpm$ ]]; then
        version="${BASH_REMATCH[1]}"
        architecture="${BASH_REMATCH[2]}"

        # Replace dots with underscores in version
        version_underscores="${version//./_}"

        # Create new filename
        new_filename="linux-mah-${version_underscores}-${architecture}.rpm"
        new_filepath="$dir_path/$new_filename"

        # Rename the file
        if mv "$rpm_file" "$new_filepath"; then
            echo "Successfully renamed RPM: $filename -> $new_filename"
        else
            echo "Error: Failed to rename RPM file $filename"
            exit 1
        fi
    else
        echo "Warning: Skipping RPM file that doesn't match expected pattern: $filename"
    fi
done

# Find and process AppImage files
find "$LINUX_BASE_DIR" -name "mah_*.AppImage" -type f | while read -r appimage_file; do
    # Extract the filename from the full path
    filename=$(basename "$appimage_file")
    dir_path=$(dirname "$appimage_file")

    # Check if filename matches expected pattern: mah_version_architecture.AppImage
    if [[ $filename =~ ^mah_([0-9]+\.[0-9]+\.[0-9]+)_([a-zA-Z0-9_]+)\.AppImage$ ]]; then
        version="${BASH_REMATCH[1]}"
        architecture="${BASH_REMATCH[2]}"

        # Replace dots with underscores in version
        version_underscores="${version//./_}"

        # Create new filename
        new_filename="linux-mah-${version_underscores}-${architecture}.AppImage"
        new_filepath="$dir_path/$new_filename"

        # Rename the file
        if mv "$appimage_file" "$new_filepath"; then
            echo "Successfully renamed AppImage: $filename -> $new_filename"
        else
            echo "Error: Failed to rename AppImage file $filename"
            exit 1
        fi
    else
        echo "Warning: Skipping AppImage file that doesn't match expected pattern: $filename"
    fi
done
