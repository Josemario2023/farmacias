# Pruebas del sistema de farmacias

Ejecutar **todo** (desde `C:\dev\farmacias`):

```powershell
.\pruebas\ejecutar-todo.ps1 -ClaveSys "TU_CLAVE_SYS"
```

| Carpeta | Qué contiene | Necesita encendido |
|---|---|---|
| `frontend/` | Utilidades del frontend (`node:test`) | nada |
| `estatico/` | Coherencia entre código y scripts | nada |
| `humo/` | Servicios reales, solo `GET` + integridad de datos | los 9 servicios |
| `base-de-datos/` | Pruebas SQL con `ROLLBACK` | contenedor Oracle |

Las pruebas unitarias del backend (Jest) están junto al código: `gateway/src/auth/`, `services/payroll/src/planillas/`, `services/inventory/src/actor/`, `services/audit/src/consolidados/` y `services/audit/src/sync/`.

Documentación completa, resultados y casos manuales: [`docs/PLAN-DE-PRUEBAS.md`](../docs/PLAN-DE-PRUEBAS.md).
Cómo funcionan (para estudiar): [`docs/estudio/08-pruebas.md`](../docs/estudio/08-pruebas.md).
