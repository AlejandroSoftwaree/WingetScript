##########################################################################################################
#                                    ADMINISTRADOR PERMISSIONS REQUIRED                                  #
#                                           ORCHESTRATOR SCRIPT                                          #
##########################################################################################################
#                                                                                                        #
#  This script serves as a primary orchestrator within the WingetScript automation system. Its main      #
# purpose is to coordinate the sequential and modular execution of child scripts for installation,       #
# configuration, and file operations, ensuring a ready-to-use development environment.                   #
#                                                                                                        #
#     FUNCTIONS:                                                                                         #
#     * Start-SecondScript.                                                                              #
#     * Test-Functions.                                                                                  #
#     * Inicializer-Function.                                                                            #
#     * Main.                                                                                            #
#                                                                                                        #
##########################################################################################################

param (
    [string[]]$FunctionNames,
    [switch]$ChainExecution
)

#Rutas
$scriptPath = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$Second = Join-Path -Path $scriptPath -ChildPath "2.Script-Profile.ps1"

function Start-SecondScript{
    # Start-Process pwsh -Verb RunAs -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-Command", "& { . '$Second' -FunctionNames 'Profile-Function' }"

    $command = ". '$Second' -FunctionNames 'Profile-Function'"
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

function Test-Functions {
    foreach ($FunctionName in $FunctionNames) {
        if (Get-Command -Name $FunctionName -ErrorAction SilentlyContinue) {
            & $FunctionName
        } else {
            Write-Host "La función '$FunctionName' no existe." -ForegroundColor Red
        }
    }
}

function Inicializer-Function{
    Write-Host "Ejecutando primer script"
    Write-Host "Ejecutando la funcion de instalacion" -ForegroundColor Cyan
    Write-Host "Actualizando App Installer" -ForegroundColor Cyan
    winget upgrade -e --id Microsoft.AppInstaller

    Write-Host "Instalando Windows Terminal" -ForegroundColor Cyan
    winget install -e --id Microsoft.WindowsTerminal

    Write-Host "Instalando Powershell 7" -ForegroundColor Cyan
    winget install -e --id Microsoft.PowerShell

    Write-Host "Instalando Node.js 22" -ForegroundColor Cyan
    winget install -e --id OpenJS.NodeJS.22

    Write-Host "Aplicando configuraciones Winget" -ForegroundColor Cyan
    winget settings

    Write-Host "Instalando OhMyPosh" -ForegroundColor Cyan
    #winget install -e --id JanDeDobbeleer.OhMyPosh -s winget
    winget install JanDeDobbeleer.OhMyPosh -e --version 26.24.1


    if ($ChainExecution.IsPresent) {
        Write-Host "Llamando al segundo script"
        Start-SecondScript
    }else{
        Write-Host "Script '1.Inicializer-File.ps1''fue ejecutado correctamente"
    }
}

function Main {
    # Install-FirstPrograms
    # Write-Host "Llamando al segundo script" -ForegroundColor Cyan
    # Start-Process pwsh -ArgumentList "-NoExit", "-Command", "& { . '$Second' -FunctionNames 'Start-AllProfileFunctions' }"
}

if ($FunctionNames) {
    Test-Functions
} else {
    Main
}