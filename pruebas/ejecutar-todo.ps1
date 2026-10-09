# Ejecuta TODAS las pruebas del proyecto y muestra un resumen.
#
# Uso (desde C:\dev\farmacias):
#   .\pruebas\ejecutar-todo.ps1 -ClaveSys "TU_CLAVE_SYS"
#
# Opciones:
#   -SinBaseDeDatos   no ejecuta las pruebas de Oracle (por si el contenedor esta apagado)
#   -SinServicios     no ejecuta las pruebas de humo (las que necesitan los servicios encendidos)
#
# Que corre cada nivel:
#   1. Unitarias del backend (Jest)  -> gateway, payroll, inventory(actor), audit  [sin nada encendido]
#   2. Unitarias del frontend (node) -> utilidades                                  [sin nada encendido]
#   3. Coherencia (node)             -> lee el codigo y los scripts                 [sin nada encendido]
#   4. Humo e integridad (node)      -> consulta los servicios con GET              [servicios encendidos]
#   5. Base de datos (SQL)           -> pruebas dentro de Oracle con ROLLBACK       [contenedor encendido]
param(
  [string]$ClaveSys = $env:ORACLE_SYS_PASSWORD,
  [switch]$SinBaseDeDatos,
  [switch]$SinServicios
)

$raiz = Split-Path $PSScriptRoot -Parent
$resumen = @()

# Ejecuta un comando, lee cuantas pruebas pasaron/fallaron y lo anota en el resumen
function Correr {
  param([string]$Nombre, [string]$Carpeta, [scriptblock]$Comando, [string]$Tipo)
  Write-Host ""
  Write-Host "=== $Nombre" -ForegroundColor Cyan
  Push-Location $Carpeta
  $salida = & $Comando 2>&1 | Out-String
  Pop-Location

  $pasan = 0; $fallan = 0; $saltadas = 0
  if ($Tipo -eq "jest") {
    if ($salida -match "Tests:\s+(?:(\d+) failed,\s*)?(?:(\d+) skipped,\s*)?(\d+) passed") {
      $fallan = [int]($Matches[1] + 0); $saltadas = [int]($Matches[2] + 0); $pasan = [int]$Matches[3]
    }
  } elseif ($Tipo -eq "node") {
    # El ejecutor de Node escribe "<simbolo> pass 28": se busca por el texto, sin el simbolo
    if ($salida -match "(?m)^\S+ pass (\d+)") { $pasan = [int]$Matches[1] }
    if ($salida -match "(?m)^\S+ fail (\d+)") { $fallan = [int]$Matches[1] }
    if ($salida -match "(?m)^\S+ skipped (\d+)") { $saltadas = [int]$Matches[1] }
  } elseif ($Tipo -eq "sql") {
    if ($salida -match "RESUMEN: (\d+) pasan, (\d+) fallan") { $pasan = [int]$Matches[1]; $fallan = [int]$Matches[2] }
  }

  # Mostrar solo lo que falla (el detalle completo esta al ejecutar la suite sola)
  # Cruz de Node y bolita de Jest, escritas con su codigo para que el archivo sea ASCII puro
  $cruz = [string][char]0x2716; $bola = [string][char]0x25CF
  $salida -split "`n" | Where-Object { $_ -match ([regex]::Escape($cruz) + "|FALLA|" + [regex]::Escape($bola) + " ") } | Select-Object -First 12 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
  $script:resumen += [pscustomobject]@{ Suite = $Nombre; Pasan = $pasan; Fallan = $fallan; Saltadas = $saltadas }
}

# ---- 1. Backend (Jest)
$jest = { npm test --silent }
Correr "Gateway - guardian de permisos"      "$raiz\gateway"           $jest "jest"
Correr "Payroll - reglas de planilla"        "$raiz\services\payroll"  $jest "jest"
Correr "Inventory - actor (quien hizo)"      "$raiz\services\inventory" { npm test --silent -- actor } "jest"
Correr "Audit - consolidados y sincronizacion" "$raiz\services\audit"  $jest "jest"

# ---- 2 y 3. Frontend y coherencia
Correr "Frontend - utilidades"               $raiz { node --test pruebas/frontend/utilidades.test.ts } "node"
Correr "Coherencia del proyecto"             $raiz { node --test pruebas/estatico/coherencia.test.mjs } "node"

# ---- 4. Humo
if (-not $SinServicios) {
  Correr "Humo e integridad (servicios vivos)" $raiz { node --test pruebas/humo/humo.test.mjs } "node"
}

# ---- 5. Base de datos
if (-not $SinBaseDeDatos) {
  if (-not $ClaveSys) {
    Write-Host "Falta -ClaveSys: se omiten las pruebas de base de datos." -ForegroundColor Yellow
  } else {
    Correr "Base de datos (Oracle)" $raiz { .\pruebas\base-de-datos\ejecutar-pruebas-bd.ps1 -ClaveSys $ClaveSys } "sql"
  }
}

# ---- Resumen
Write-Host ""
Write-Host "================ RESUMEN ================" -ForegroundColor Green
$resumen | Format-Table -AutoSize | Out-String | Write-Host
$totalPasan = ($resumen | Measure-Object Pasan -Sum).Sum
$totalFallan = ($resumen | Measure-Object Fallan -Sum).Sum
Write-Host "TOTAL: $totalPasan pasan, $totalFallan fallan" -ForegroundColor $(if ($totalFallan -eq 0) { "Green" } else { "Yellow" })
if ($totalFallan -gt 0) { exit 1 } else { exit 0 }
