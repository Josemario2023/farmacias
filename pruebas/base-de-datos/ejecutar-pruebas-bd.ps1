# Ejecuta las pruebas de base de datos contra el contenedor Oracle.
#
# Uso (desde C:\dev\farmacias):
#   .\pruebas\base-de-datos\ejecutar-pruebas-bd.ps1 -ClaveSys "TU_CLAVE_SYS"
#
# Las pruebas no dejan datos: todo lo que escriben se deshace con ROLLBACK.
param(
  [string]$Contenedor = "farmacias-oracle",
  [string]$ClaveSys = $env:ORACLE_SYS_PASSWORD
)

if (-not $ClaveSys) {
  throw "Falta la clave de SYS: usa -ClaveSys o define la variable ORACLE_SYS_PASSWORD"
}

docker cp "$PSScriptRoot\pruebas-bd.sql" "${Contenedor}:/tmp/pruebas-bd.sql" 2>&1 | Out-Null
# Copia sin los retornos de carro de Windows (docker cp deja el archivo como root, no se puede editar en sitio)
docker exec $Contenedor sh -c "tr -d '\r' < /tmp/pruebas-bd.sql > /tmp/pruebas-bd.lf.sql"
$salida = docker exec -e NLS_LANG=.AL32UTF8 $Contenedor sqlplus -S "sys/$ClaveSys@//localhost:1521/FREEPDB1 as sysdba" "@/tmp/pruebas-bd.lf.sql" 2>&1 | Out-String
# Se emite como salida (no con Write-Host) para que ejecutar-todo.ps1 pueda leer el resumen
$salida

if ($salida -match "FALLA") { exit 1 } else { exit 0 }
