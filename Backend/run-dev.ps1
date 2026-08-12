# run-dev.ps1  (place this file inside the Backend/ folder)
Set-Location -Path $PSScriptRoot
$env:SPRING_PROFILES_ACTIVE = "dev"
if (Test-Path ".\mvnw.cmd") {
  .\mvnw.cmd spring-boot:run -DskipTests
} else {
  mvn spring-boot:run -DskipTests
}
