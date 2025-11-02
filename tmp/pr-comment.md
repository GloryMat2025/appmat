CI artifact is authoritative — PNG export verified

I've verified the PNG export for this branch. The CI workflow produced and uploaded the artifact 'architecture-png'. Please verify using the steps below.

- Run: Export workflow run id: 18739558597
- Artifact: architecture-png
- PNG size (bytes): 50594
- PNG sha256: 3e444b39c760bd8ebf483206b5a5fcc0bcf5bf494f5705fee7e4165dcf9f5c2e

To download & verify locally (PowerShell):

gh run download 18739558597 --repo GloryMat2025/appmat --name architecture-png --dir tmp
Expand-Archive -LiteralPath .\tmp\architecture-png.zip -DestinationPath .\tmp\architecture-png -Force
Get-FileHash .\tmp\architecture-png\architecture-refined.png -Algorithm SHA256 | Format-List
Get-Item .\tmp\architecture-png\architecture-refined.png | Select-Object Name, Length

Or (cmd):

gh run download 18739558597 --repo GloryMat2025/appmat --name architecture-png --dir tmp
powershell -Command "Expand-Archive -LiteralPath .\\tmp\\architecture-png.zip -DestinationPath .\\tmp\\architecture-png -Force"
certutil -hashfile tmp\\architecture-png\\architecture-refined.png SHA256

Notes:
- The committed PNG was removed from the branch; CI artifacts are authoritative for review.
- The export workflow now posts SHA256 & size for reviewer verification.
