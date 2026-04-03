##########################################################################################################
#                                    ADMINISTRADOR PERMISSIONS REQUIRED                                  #
#                                           ORCHESTRATOR SCRIPT                                          #
##########################################################################################################
#                                                                                                        #
#  This script serves as a primary orchestrator within the WingetScript automation system. Its main      #
# purpose is to coordinate the sequential and modular execution of child scripts for installation,       #
# configuration, and file operations, ensuring a ready-to-use development environment.                   #
#                                                                                                        #
#     * Start-ThirdScript                                                                                #
#     * Start-PSProfile                                                                                  #
#     * Add-OhmyposhlineToProfile                                                                        #
#     * Profile-Function                                                                                 #
#                                                                                                        #
##########################################################################################################

param(
    [string[]]$FunctionNames,
    [switch]$ChainExecution
)
#Rutas
$scriptPath = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$Third = Join-Path -Path $scriptPath -ChildPath "3.Script-Copyfiles.ps1"

$profilePath = $PROFILE
$profileDir = [System.IO.Path]::GetDirectoryName($profilePath)

function Start-ThirdScript{
    $command = ". '$Third' -FunctionNames 'Copyfiles-Function'"
    if ($ChainExecution) {
        $command += " -ChainExecution"
    }
    $processArgs = @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", "& { $command }"
    )
    Start-Process pwsh -Verb RunAs -ArgumentList $processArgs
}

function Start-PSProfile {
    if (-not(Test-Path -Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force
    }
    if (-not(Test-Path -Path $profilePath)) {
        New-Item -ItemType File -Path $profilePath -Force
    }
}

Function Add-OhmyposhlineToProfile{
    $mythemePath = Join-Path -Path $env:POSH_THEMES_PATH -ChildPath 'my-theme.omp.json'
    $ohmyposhInit = "oh-my-posh init pwsh --config '$mythemePath' | Invoke-Expression"

    $profileContent = Get-Content -Path $profilePath -Raw
    if ($profileContent -notmatch [regex]::Escape($ohmyposhInit)) {
        Add-Content -Path $profilePath -Value "`r`n$ohmyposhInit`r`n"
        Write-Host "Inicialización de OhMyPosh añadida al perfil de PowerShell." -ForegroundColor Green
    } else {
        Write-Host "Inicialización de OhMyPosh ya existe en el perfil de PowerShell." -ForegroundColor Green
    }
}

function Test-Functions {
    foreach ($FunctionName in $FunctionNames) {
        if (Get-Command -Name $FunctionName -ErrorAction SilentlyContinue) {
            & $FunctionName
        } else {
            Write-Host "La función '$FunctionName' no existe." -ForegroundColor Red
        }
    }
}

function Profile-Function {
    Write-Host "Ejecutando segundo script (Configuración de Perfil)" -ForegroundColor Cyan
    Start-PSProfile
    Add-OhmyposhlineToProfile
    
    Write-Host "Perfil configurado correctamente. (Funciones migradas al nuevo winget-cli)" -ForegroundColor Green
    
    if ($ChainExecution.IsPresent) {
        Write-Host "Llamando al tercer script..."
        Start-ThirdScript
    } else {
        Write-Host "Script '2.Script-Profile.ps1' finalizado."
    }
}

if ($FunctionNames) {
    Test-Functions
} else {
    Profile-Function
}
