# PowerShell script to rename Tauri Windows output files

# Set the base directory where the MSI and EXE files are located
$MSI_BASE_DIR = "./tauri/target"

# Check if the directory exists
if (-not (Test-Path $MSI_BASE_DIR)) {
    Write-Host "Error: Directory $MSI_BASE_DIR does not exist" -ForegroundColor Red
    exit 1
}

# Find all MSI files recursively in the target directory
Get-ChildItem -Path $MSI_BASE_DIR -Recurse -Filter "mah_*.msi" | ForEach-Object {
    $filename = $_.Name
    $dir_path = $_.Directory.FullName

    # Check if filename matches expected pattern: mah_version_architecture_en-US.msi
    if ($filename -match '^mah_([0-9]+\.[0-9]+\.[0-9]+)_([a-zA-Z0-9_]+)_en-US\.msi$') {
        $version = $matches[1]
        $architecture = $matches[2]

        # Replace dots with underscores in version
        $version_underscores = $version -replace '\.', '_'

        # Create new filename
        $new_filename = "win-mah-$version_underscores-$architecture.msi"
        $new_filepath = Join-Path $dir_path $new_filename

        # Rename the file
        try {
            Rename-Item -Path $_.FullName -NewName $new_filename
            Write-Host "Successfully renamed: $filename -> $new_filename" -ForegroundColor Green
        } catch {
            Write-Host "Error: Failed to rename $filename" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Warning: Skipping MSI file that doesn't match expected pattern: $filename" -ForegroundColor Yellow
    }
}

# Find all setup EXE files recursively in the target directory
Get-ChildItem -Path $MSI_BASE_DIR -Recurse -Filter "mah_*-setup.exe" | ForEach-Object {
    $filename = $_.Name
    $dir_path = $_.Directory.FullName

    # Check if filename matches expected pattern: mah_version_architecture-setup.exe
    if ($filename -match '^mah_([0-9]+\.[0-9]+\.[0-9]+)_([a-zA-Z0-9_]+)-setup\.exe$') {
        $version = $matches[1]
        $architecture = $matches[2]

        # Replace dots with underscores in version
        $version_underscores = $version -replace '\.', '_'

        # Create new filename
        $new_filename = "win-mah-$version_underscores-$architecture.exe"
        $new_filepath = Join-Path $dir_path $new_filename

        # Rename the file
        try {
            Rename-Item -Path $_.FullName -NewName $new_filename
            Write-Host "Successfully renamed: $filename -> $new_filename" -ForegroundColor Green
        } catch {
            Write-Host "Error: Failed to rename $filename" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Warning: Skipping EXE file that doesn't match expected pattern: $filename" -ForegroundColor Yellow
    }
}
